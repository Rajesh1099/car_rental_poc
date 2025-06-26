from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from typing import Optional, List
from app import schemas

router = APIRouter()

# ✅ Dependency to check admin access
def admin_required(user=Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/", summary="Get all users", response_model=List[schemas.DisplayUserInfoAdmin])
def getall_users(
user_id: Optional[int] = None,
    email: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    """
    Fetches all users from the database.
    """
    
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    
    if user_id:
        user_obj = db.query(User).filter(User.id == user_id).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
        users = [user_obj]

    elif email:
        user_obj = db.query(User).filter(User.email.ilike(f"%{email}%")).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with email '{email}' not found")
        users = [user_obj]

    elif username:
        user_obj = db.query(User).filter(User.name.ilike(f"%{username}%")).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with username '{username}' not found")
        users = [user_obj]

    return users


@router.delete("/{user_id}", summary="Delete a user")
def delete_user(
    user_id,
    email,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(admin_required)
):
    """
    Deletes a user by ID, Email, Name.
    """
    
    user = db.query(User).filter(User.id == user_id, User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No user found with ID '{user_id}' and email '{email}'"
        )

    db.delete(user)
    db.commit()
    return {
    "detail": f"User with ID: '{user_id}' and email: '{email}' deleted successfully"
}
