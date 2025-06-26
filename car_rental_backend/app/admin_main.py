# app/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()

# ✅ Admin check
def admin_required(user=Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/dashboard")
def admin_dashboard(user=Depends(admin_required)):
    return {"message": f"Welcome Admin {user.name}!"}
