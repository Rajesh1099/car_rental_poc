from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas, database
from app.database import get_db
from app.auth import get_current_user
from app.models import Payment, Booking, BookingStatusEnum, PaymentStatusEnum
from app.schemas import PaymentWithDetailsAdmin
from app.user.payments import send_booking_confirmation_email

router = APIRouter()

# ✅ Dependency to check admin access
def admin_required(user=Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ✅ Get all payments with optional filters
@router.get("/", summary="Get all payments", response_model=List[PaymentWithDetailsAdmin])
def get_all_payments(
    status: Optional[PaymentStatusEnum] = None,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    query = db.query(Payment).join(models.User)

    if user_id:
        user_obj = db.query(models.User).filter(models.User.id == user_id).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
        query = query.filter(models.User.id == user_id)
    elif email:
        user_obj = db.query(models.User).filter(models.User.email.ilike(f"%{email}%")).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with email '{email}' not found")
        query = query.filter(models.User.email.ilike(f"%{email}%"))
    elif username:
        user_obj = db.query(models.User).filter(models.User.name.ilike(f"%{username}%")).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail=f"User with username '{username}' not found")
        query = query.filter(models.User.name.ilike(f"%{username}%"))

    if status:
        query = query.filter(Payment.status == status)

    payments = query.all()
    if not payments:
        raise HTTPException(status_code=404, detail="No payments found")

    return payments

# ✅ Delete a payment
@router.delete("/{payment_id}", summary="Delete a payment")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.delete(payment)
    db.commit()
    return {"message": f"Payment {payment_id} deleted successfully"}

@router.put("/{payment_id}/status", summary="Update payment status")
def update_payment_status(
    payment_id: int,
    status: PaymentStatusEnum,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found for payment")

    user_obj = booking.user
    car = booking.car

    # ❌ Prevent updating to SUCCESS for cancelled bookings
    if booking.status == BookingStatusEnum.CANCELLED and status == PaymentStatusEnum.SUCCESS:
        raise HTTPException(
            status_code=400,
            detail="Cannot mark payment as SUCCESS for a cancelled booking"
        )

    # ✅ Update logic
    if status == PaymentStatusEnum.SUCCESS:
        if booking.status == BookingStatusEnum.PENDING and payment.status in [
            PaymentStatusEnum.PENDING, PaymentStatusEnum.CANCELLED
        ]:
            payment.status = PaymentStatusEnum.SUCCESS
            booking.status = BookingStatusEnum.CONFIRMED
        else:
            raise HTTPException(
                status_code=400,
                detail="Payment can only be marked SUCCESS if booking is PENDING and payment is PENDING or CANCELLED"
            )
    else:
        if payment.status == PaymentStatusEnum.CANCELLED and status == PaymentStatusEnum.PENDING:
            raise HTTPException(status_code=400, detail="Cannot revert CANCELLED payment to PENDING")
        payment.status = status

    db.commit()
    db.refresh(payment)
    db.refresh(booking)

    # ✅ Send email only for SUCCESS
    if payment.status == PaymentStatusEnum.SUCCESS:
        payment_details = schemas.EmailPaymentDetails(
            booking_id=payment.booking_id,
            amount=payment.amount,
            car_brand=car.brand,
            car_model=car.model,
            car_license_plate=car.license_plate,
            car_year=car.year,
            car_start_date=booking.start_date,
            car_end_date=booking.end_date,
            car_start_time=booking.start_time,
            car_end_time=booking.end_time,
            payment_gateway_id=payment.payment_gateway_id,
            status=payment.status.value
        )

        send_booking_confirmation_email(
            name=user_obj.name,
            user_email=user_obj.email,
            payment_details=payment_details
        )

    return {
        "message": f"Payment {payment_id} status updated to '{status.value}'",
        "payment": payment
    }
