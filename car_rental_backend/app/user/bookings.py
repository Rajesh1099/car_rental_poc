from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app import models, schemas
from app.database import get_db
from dotenv import load_dotenv
import os
import smtplib
from app.auth import get_current_user
from app.models import BookingStatusEnum, PaymentStatusEnum
from email.mime.text import MIMEText
from app.database import SessionLocal
import time
from fastapi import BackgroundTasks


router = APIRouter()
load_dotenv()

# Email configuration
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))


# ---------------------------- EMAIL FUNCTION ----------------------------
def send_booking_cancellation_email(name: str, user_email: str, booking: models.Booking):
    car = booking.car
    payment = booking.payments[0] if booking.payments else None

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
            <p>Your booking with ID <strong>{booking.id}</strong> has been <span style="color: red;"><strong>cancelled</strong></span> successfully.</p>

            <table>
                <tr><th>Detail</th><th>Information</th></tr>
                <tr><td><strong>Amount Refunded</strong></td><td style="color: green;"><strong>₹{payment.amount if payment else 'N/A'}</strong></td></tr>
                <tr><td><strong>Car Brand</strong></td><td>{car.brand.upper()}</td></tr>
                <tr><td><strong>Car Model</strong></td><td>{car.model.upper()}</td></tr>
                <tr><td><strong>License Plate</strong></td><td>{car.license_plate.upper()}</td></tr>
                <tr><td><strong>Manufacture Year</strong></td><td>{car.year}</td></tr>
                <tr><td><strong>Start Date</strong></td><td>{booking.start_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>Start Time</strong></td><td>{booking.start_time.strftime('%H:%M')}</td></tr>
                <tr><td><strong>End Date</strong></td><td>{booking.end_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>End Time</strong></td><td>{booking.end_time.strftime('%H:%M')}</td></tr>
            </table>

            <div class="footer">
                Thank you for choosing our service.<br/>
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

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, user_email, msg.as_string())
    except Exception as e:
        print(f"Email sending failed: {e}")


# ---------------------------- BOOK A CAR ----------------------------
@router.post("/", response_model=schemas.BookingResponse)
def book_car(
    booking_data: schemas.BookingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    car = db.query(models.Car).filter(models.Car.id == booking_data.car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    requested_start = datetime.combine(booking_data.start_date, booking_data.start_time)
    requested_end = datetime.combine(booking_data.end_date, booking_data.end_time)

    if requested_end <= requested_start:
        raise HTTPException(status_code=400, detail="End datetime must be after start datetime")

    active_bookings = db.query(models.Booking).filter(
        models.Booking.car_id == booking_data.car_id,
        models.Booking.status != BookingStatusEnum.CANCELLED
    ).all()

    for b in active_bookings:
        existing_start = datetime.combine(b.start_date, b.start_time)
        existing_end = datetime.combine(b.end_date, b.end_time)
        if existing_start < requested_end and existing_end > requested_start:
            raise HTTPException(status_code=400, detail="Car is already booked for the selected date/time range")

    new_booking = models.Booking(
    car_id=booking_data.car_id,
    user_id=current_user.id,
    start_date=booking_data.start_date,
    start_time=booking_data.start_time,
    end_date=booking_data.end_date,
    end_time=booking_data.end_time,
    duration_hours=booking_data.duration_hours,
    home_delivery=booking_data.home_delivery,
    coupon_code=booking_data.coupon_code,
    base_price=booking_data.base_price,
    gst=booking_data.gst,
    insurance=booking_data.insurance,
    delivery_charge=booking_data.delivery_charge,
    discount=booking_data.discount,
    total_price=booking_data.total_price,
    status=BookingStatusEnum.PENDING
)

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # ✅ Add background task for auto-cancel after 5 minutes
    background_tasks.add_task(cancel_unconfirmed_booking, new_booking.id)

    return new_booking


# ---------------------------- CANCEL BOOKING ----------------------------
@router.put("/{booking_id}/cancel", response_model=schemas.BookingResponse)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")

    payment = db.query(models.Payment).filter(
        models.Payment.booking_id == booking.id,
        models.Payment.user_id == current_user.id
    ).first()

    booking.status = BookingStatusEnum.CANCELLED
    if payment:
        payment.status = PaymentStatusEnum.CANCELLED

    db.commit()
    db.refresh(booking)

    # Send email with full details
    booking_with_details = db.query(models.Booking).options(
        joinedload(models.Booking.car),
        joinedload(models.Booking.payments)
    ).filter(models.Booking.id == booking_id).first()

    send_booking_cancellation_email(
        name=current_user.name,
        user_email=current_user.email,
        booking=booking_with_details
    )

    return booking


# ---------------------------- GET BOOKING BY ID ----------------------------
@router.get("/{booking_id}", response_model=schemas.BookingWithDetails)
def get_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).options(
        joinedload(models.Booking.car),
        joinedload(models.Booking.payments)
    ).filter(
        models.Booking.id == booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return booking


# ---------------------------- AUTO-CANCEL UNCONFIRMED BOOKING ----------------------------
def cancel_unconfirmed_booking(booking_id: int):
    time.sleep(300)  # ⏱ wait 5 minutes
    db = SessionLocal()
    try:
        booking = db.query(models.Booking).filter(
            models.Booking.id == booking_id
        ).first()

        if not booking:
            return  # Already deleted

        db.refresh(booking)  # Make sure it's up-to-date

        if booking.status == BookingStatusEnum.PENDING:
            db.delete(booking)  # Or: booking.status = BookingStatusEnum.CANCELLED
            db.commit()
    except Exception as e:
        print(f"[Auto-cancel failed] Booking ID: {booking_id}, Error: {e}")
    finally:
        db.close()
