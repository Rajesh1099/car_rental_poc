# app/email_utils.py

import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from jose import jwt
from datetime import datetime, timedelta
from app.config import settings

load_dotenv()

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# ✅ Generate JWT email verification token (valid 30 minutes)
def generate_email_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ✅ Send email with verification link
def send_verification_email(name: str, to_email: str, token: str):
    subject = "Verify your email"
    verification_link = f"https://car-rental-backend-mda4.onrender.com/verify-email?token={token}"  # Corrected URL path
    body = f"""
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {{
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8f9fa;
        color: #333;
        padding: 20px;
      }}
      .container {{
        max-width: 600px;
        margin: auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }}
      h3 {{
        color: #007bff;
      }}
      p {{
        font-size: 16px;
        line-height: 1.5;
      }}
      .button {{
        display: inline-block;
        margin-top: 20px;
        padding: 12px 24px;
        font-size: 16px;
        color: #ffffff;
        background-color: #28a745;
        text-decoration: none;
        border-radius: 5px;
      }}
      .footer {{
        margin-top: 30px;
        font-size: 12px;
        color: #888;
      }}
    </style>
  </head>
  <body>
    <div class="container">
      <p>Hi <strong>{name}</strong>,</p>
      
      <h3>Welcome to BoomBoomCars!</h3>
      
      <p>Thank you for signing up. Please verify your email address to activate your account:</p>
      
      <a href="{verification_link}" class="button">Verify Email</a>
      
      <div class="footer">
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <p>&copy; 2025 BoomBoomCars. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
"""


    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, to_email, msg.as_string())


from email.mime.text import MIMEText

def send_password_reset_email(name: str, email: str, token: str):
    reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={token}"
    
    subject = "Reset Your Password"
    body = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            padding: 20px;
          }}
          .container {{
            max-width: 600px;
            margin: auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }}
          h3 {{
            color: #dc3545;
          }}
          p {{
            font-size: 16px;
            line-height: 1.5;
          }}
          .button {{
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            font-size: 16px;
            color: #ffffff;
            background-color: #dc3545;
            text-decoration: none;
            border-radius: 5px;
          }}
          .footer {{
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }}
        </style>
      </head>
      <body>
        <div class="container">
          <p>Hi <strong>{name}</strong>,</p>
          <h3>Password Reset Request</h3>
          <p>We received a request to reset your BoomBoomCars password. Click the button below to proceed:</p>
          <a href="{reset_link}" class="button">Reset Password</a>
          <p style="margin-top: 30px;">If you didn’t request a password reset, you can safely ignore this email.</p>
          <div class="footer">
            <p>Need help? Contact support at BoomBoomCars.</p>
            <p>&copy; 2025 BoomBoomCars. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
    """

    msg = MIMEText(body, "html")  # 🔑 Specify content type as HTML
    msg['Subject'] = subject
    msg['From'] = EMAIL_SENDER
    msg['To'] = email

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, email, msg.as_string())
