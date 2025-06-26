from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from enum import Enum
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from email.mime.text import MIMEText
import smtplib
import os
from dotenv import load_dotenv
from app.models import BookingStatusEnum, PaymentStatusEnum


router = APIRouter()

load_dotenv()

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT") or 587)

# Validate environment variables
if not all([EMAIL_SENDER, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT]):
    raise RuntimeError("Missing one or more required email environment variables.")

# Enums
class BookingStatus(str, Enum):
    PENDING = "Pending"
    CANCELLED = "Cancelled"

class PaymentStatusEnum(str, Enum):
    PENDING = "Pending"
    SUCCESS = "Success"
    CANCELLED = "Cancelled"

# --------------------- Email Functions -----------------------



def send_booking_cancellation_email(name: str, user_email: str, booking_details: schemas.BookingWithDetails):
    car = booking_details.car
    payment = booking_details.payments[0] if booking_details.payments else None

    subject = "❌ Booking Cancellation"

    body = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                color: #333;
                background-color: #f9f9f9;
                padding: 20px;
            }}
            .container {{
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #ddd;
                max-width: 600px;
                margin: auto;
            }}
            h2 {{
                color: #d9534f;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }}
            th, td {{
                text-align: left;
                padding: 12px;
                border-bottom: 1px solid #eee;
            }}
            th {{
                background-color: #f2f2f2;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 20px;
                font-size: 14px;
                color: #888;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Booking Cancelled</h2>
            <p>Hello <strong>{name}</strong>,</p>
            <p>Your booking with ID <strong>{booking_details.id}</strong> has been <span style="color: red;"><strong>cancelled</strong></span> successfully.</p>

            <table>
                <tr><th>Detail</th><th>Information</th></tr>
                <tr><td><strong>Amount Refunded</strong></td><td style="color: green;"><strong>₹{payment.amount if payment else 'N/A'}</strong></td></tr>
                <tr><td><strong>Car Brand</strong></td><td>{car.brand}</td></tr>
                <tr><td><strong>Car Model</strong></td><td>{car.model}</td></tr>
                <tr><td><strong>License Plate</strong></td><td>{car.license_plate}</td></tr>
                <tr><td><strong>Manufacture Year</strong></td><td>{car.year}</td></tr>
                <tr><td><strong>Start Date</strong></td><td>{booking_details.start_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>Start Time</strong></td><td>{booking_details.start_time.strftime('%H:%M')}</td></tr>
                <tr><td><strong>End Date</strong></td><td>{booking_details.end_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>End Time</strong></td><td>{booking_details.end_time.strftime('%H:%M')}</td></tr>
            </table>

            <div class="footer">
                Thank you for choosing BoomBoomCars.<br/>
                We hope to serve you again in the future!
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = EMAIL_SENDER
    msg["To"] = user_email

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, user_email, msg.as_string())


# --------------------- Admin Dependency -----------------------

def admin_required(user=Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# --------------------- Admin Routes ---------------------------

@router.get("/", response_model=List[schemas.BookingWithDetailsAdmin])
def get_all_bookings(
    status: Optional[BookingStatus] = None,
    user_id: Optional[int] = None,
    email: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    query = db.query(models.Booking).join(models.User)

    if user_id:
        query = query.filter(models.User.id == user_id)
    elif email:
        query = query.filter(models.User.email.ilike(f"%{email}%"))
    elif username:
        query = query.filter(models.User.name.ilike(f"%{username}%"))

    if status:
        query = query.filter(models.Booking.status == status.value)

    bookings = query.all()
    if not bookings:
        raise HTTPException(status_code=404, detail="No bookings found")

    return bookings

@router.delete("/{booking_id}")
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": f"Booking {booking_id} deleted successfully"}

@router.put("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    status: BookingStatus,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # ❌ Prevent updating a cancelled booking
    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot update a cancelled booking")

    if status == BookingStatus.CANCELLED:
        booking.status = BookingStatusEnum.CANCELLED
        payment.status = PaymentStatusEnum.CANCELLED
        db.commit()

        db.refresh(booking, ['car', 'payments'])
        db.refresh(booking)
        db.refresh(payment)

        user = db.query(models.User).filter(models.User.id == booking.user_id).first()

        send_booking_cancellation_email(
            name=user.name,
            user_email=user.email,
            booking_details=booking
        )

    elif status == BookingStatus.PENDING:
        booking.status = BookingStatusEnum.PENDING
        payment.status = PaymentStatusEnum.PENDING
        db.commit()
        db.refresh(booking)
        db.refresh(payment)
    else:
        raise HTTPException(status_code=400, detail="Invalid status update requested")

    return {
        "message": f"Booking {booking_id} status updated to '{status.value}'",
        "booking": booking
    }



@router.put("/{booking_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    payment = db.query(models.Payment).filter(models.Payment.booking_id == booking.id).first()
    booking.status = BookingStatusEnum.CANCELLED
    payment.status = PaymentStatusEnum.CANCELLED

    db.commit()
    db.refresh(booking)
    db.refresh(payment)
    db.refresh(booking, ['car', 'payments'])

    user = db.query(models.User).filter(models.User.id == booking.user_id).first()
    send_booking_cancellation_email(name=user.name, user_email=user.email, booking_details=booking)

    return booking
