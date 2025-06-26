from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.email_utils import generate_email_token, send_verification_email
from app.database import get_db
from app.auth import get_current_user
from app import models, schemas, utils

router = APIRouter()

@router.get("/profile", response_model=schemas.ShowUser)
def get_user_profile(current_user: models.User = Depends(get_current_user)):
    """
    Get the current logged-in user's profile.
    """
    return current_user

@router.put("/profile/update")
def update_user_profile(
    updated_user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_in_db = db.query(models.User).filter(models.User.id == current_user.id).first()

    if not user_in_db:
        raise HTTPException(status_code=404, detail="User not found")

    messages = []

    # Update name
    if updated_user.name and updated_user.name != user_in_db.name:
        user_in_db.name = updated_user.name
        messages.append("Name updated successfully.")

    # Update email
    if updated_user.email and updated_user.email != user_in_db.email:
        existing = db.query(models.User).filter(models.User.email == updated_user.email).first()
        if existing and existing.id != user_in_db.id:
            raise HTTPException(status_code=400, detail="Email already in use.")

        user_in_db.email = updated_user.email
        user_in_db.is_verified = False

        # Send verification
        token = generate_email_token(updated_user.email)
        send_verification_email(updated_user.name or user_in_db.name, updated_user.email, token)
        messages.append("Email updated successfully. Please check your inbox/spam to verify.")

    # Update password
    if updated_user.password:
        user_in_db.hashed_password = utils.hash_password(updated_user.password)
        messages.append("Password updated successfully.")

    # If nothing changed
    if not messages:
        return {"success": False, "message": "No changes detected."}

    db.commit()
    db.refresh(user_in_db)

    return {
        "success": True,
        "messages": messages,
        "updated_user": {
            "id": user_in_db.id,
            "name": user_in_db.name,
            "email": user_in_db.email,
            "is_verified": user_in_db.is_verified
        }
    }



@router.get("/booking_history",response_model=List[schemas.BookingWithDetails])
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all bookings for the current user.
    """
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    return bookings


@router.get("/payment_history", response_model=List[schemas.PaymentWithDetails])
def get_payment_history(
    status: Optional[str] = Query(None, description="Filter by status (e.g., Success, Pending, Cancelled)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all payments made by the logged-in user with optional status filter.
    Includes full car and user info in the response.
    """
    # Join explicitly to resolve ambiguity
    query = db.query(models.Payment).join(
        models.Booking, models.Payment.booking_id == models.Booking.id
    ).join(
        models.Car, models.Payment.car_id == models.Car.id
    ).join(
        models.User, models.Booking.user_id == models.User.id  # ✅ disambiguated join
    ).filter(
        models.Booking.user_id == current_user.id
    )

    if status:
        query = query.filter(models.Payment.status.ilike(status))

    payments = query.all()

    result = []
    for payment in payments:
        # Inject computed fields manually
        payment.car_model = payment.booking.car.model
        payment.car_brand = payment.booking.car.brand
        payment.car_license_plate = payment.booking.car.license_plate
        payment.car_year = payment.booking.car.year
        payment.username = payment.booking.user.name
        result.append(payment)

    if not result:
        raise HTTPException(status_code=404, detail="No payments found")

    return result
