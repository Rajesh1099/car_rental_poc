from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta, datetime
import requests
from urllib.parse import urlencode
from fastapi.responses import RedirectResponse

from app import schemas, models, database, utils
from app.config import settings
from app.email_utils import (
    send_password_reset_email,
    generate_email_token,
    send_verification_email
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# ----------------------
# Dependency: DB session
# ----------------------
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------
# Utility: JWT Token
# -------------------
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=10080)) # Default 7 days
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# -----------------------
# Register New User
# -----------------------
@router.post("/register", response_model=schemas.ShowUser)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = utils.hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email
    token = generate_email_token(user.email)
    send_verification_email(user.name, user.email, token)

    return new_user


# -----------------------
# Verify Email Token
# -----------------------
from fastapi.responses import HTMLResponse

@router.get("/verify-email", response_class=HTMLResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.is_verified:
            user.is_verified = True
            db.commit()

        # ✅ Return HTML page that auto-redirects after 2 seconds
        return HTMLResponse(content=f"""
        <html>
          <head>
            <meta http-equiv="refresh" content="2;url=http://localhost:5173" />
            <title>Email Verified</title>
            <style>
              body {{
                font-family: Arial, sans-serif;
                text-align: center;
                padding-top: 100px;
                background-color: #f4f4f4;
              }}
              .box {{
                background: white;
                display: inline-block;
                padding: 30px 50px;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              }}
            </style>
          </head>
          <body>
            <div class="box">
              <h2>✅ Email verified successfully!</h2>
              <p>Redirecting you to the Login page...</p>
            </div>
          </body>
        </html>
        """, status_code=200)

    except JWTError:
        return HTMLResponse(
            content="""
            <html>
              <body style="font-family: Arial; text-align: center; padding-top: 100px; color: red;">
                <h2>❌ Invalid or expired verification link.</h2>
              </body>
            </html>
            """,
            status_code=400
        )



# -----------------------
# Login with Email/Pass
# -----------------------
@router.post("/login", response_model=schemas.TokenSchema)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")

    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.is_admin,
        "is_verified": user.is_verified
    }


# -----------------------
# Forgot Password
# -----------------------
@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = generate_email_token(user.email)
    send_password_reset_email(user.name, user.email, token)

    return {"message": "Password reset link sent to your email."}


# -----------------------
# Reset Password
# -----------------------
@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.hashed_password = utils.hash_password(request.new_password)
        db.commit()

        return {"message": "Password has been reset successfully."}

    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")


# -----------------------
# Get Current User
# -----------------------
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise credentials_exception

    return user


# -----------------------
# Google OAuth Login Flow
# -----------------------
@router.get("/google/login")
def google_login():
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return {"auth_url": url}




from fastapi.responses import RedirectResponse
from urllib.parse import urlencode

@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    # Step 1: Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    token_resp = requests.post(token_url, data=data)
    token_resp.raise_for_status()
    tokens = token_resp.json()
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Google access token not found.")

    # Step 2: Get user info
    userinfo_resp = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    userinfo_resp.raise_for_status()
    userinfo = userinfo_resp.json()

    email = userinfo.get("email")
    name = userinfo.get("name")
    if not email:
        raise HTTPException(status_code=400, detail="Google user email not found.")

    # Step 3: Check or create user
    user = db.query(models.User).filter(models.User.email == email).first()

    if user:
      if user.is_admin:
        redirect_url = (
            "http://localhost:5173/"
            "?error=admin_login_not_allowed"
        )
        return RedirectResponse(url=redirect_url)


        
    else:
        user = models.User(
            name=name or email.split("@")[0],
            email=email,
            hashed_password="",
            is_verified=True,
            is_admin=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Step 4: Generate JWT
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Step 5: Redirect to frontend with token and flags
    redirect_url = (
        f"http://localhost:5173/google/success"
        f"?access_token={access_token}"
        f"&is_admin={user.is_admin}"
        f"&is_verified={user.is_verified}"
    )
    return RedirectResponse(url=redirect_url)
