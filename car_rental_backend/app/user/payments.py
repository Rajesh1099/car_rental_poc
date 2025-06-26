from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from dotenv import load_dotenv
import os
import smtplib
from email.mime.text import MIMEText
from app import models, schemas
from app.models import BookingStatusEnum, PaymentStatusEnum
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()
load_dotenv()

# 📧 Email Configuration
EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))

# -----------------------------------------------------------
# ✅ Email Sender (HTML template)
# -----------------------------------------------------------
def send_booking_confirmation_email(name: str, user_email: str, payment_details: schemas.PaymentWithDetails):
    subject = "✅ Booking Confirmation"
    body = f"""
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f4f8fb;
                padding: 20px;
            }}
            .container {{
                background-color: #fff;
                padding: 25px;
                border-radius: 10px;
                border: 1px solid #ddd;
                max-width: 600px;
                margin: auto;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            h2 {{ color: #28a745; }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }}
            th, td {{
                padding: 12px;
                border-bottom: 1px solid #eee;
                text-align: left;
            }}
            th {{
                background-color: #f1f1f1;
                font-weight: bold;
            }}
            .footer {{
                margin-top: 25px;
                font-size: 14px;
                color: #888;
                text-align: center;
            }}
            .highlight {{ color: #007bff; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Booking Confirmed!</h2>
            <p>Hello <strong>{name}</strong>,</p>
            <p>Your booking ID <span class="highlight">{payment_details.booking_id}</span> has been 
            <strong style="color: green;">successfully processed</strong>.</p>

            <table>
                <tr><th>Detail</th><th>Information</th></tr>
                <tr><td><strong>Amount Paid</strong></td><td style="color: green;"><strong>₹{payment_details.amount}</strong></td></tr>
                <tr><td><strong>Car Brand</strong></td><td>{payment_details.car_brand.upper()}</td></tr>
                <tr><td><strong>Car Model</strong></td><td>{payment_details.car_model.upper()}</td></tr>
                <tr><td><strong>License Plate</strong></td><td>{payment_details.car_license_plate.upper()}</td></tr>
                <tr><td><strong>Manufacture Year</strong></td><td>{payment_details.car_year}</td></tr>
                <tr><td><strong>Start Date</strong></td><td>{payment_details.car_start_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>Start Time</strong></td><td>{payment_details.car_start_time.strftime('%H:%M')}</td></tr>
                <tr><td><strong>End Date</strong></td><td>{payment_details.car_end_date.strftime('%d-%m-%Y')}</td></tr>
                <tr><td><strong>End Time</strong></td><td>{payment_details.car_end_time.strftime('%H:%M')}</td></tr>
            </table>
            <br/><br/>
      
            <div class="important-note">
            ⚠️ <strong>Please bring the following documents at pickup:</strong><br/>
            - Original Driving License<br/>
            - 2 Passport Size Photographs<br/>
            - Aadhaar Card (for address verification)
            </div>

            <div class="footer">
                🚗 Thank you for choosing BoomBoomCars!<br/>
                Wishing you a smooth and enjoyable ride.
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
        print("❌ Email failed:", str(e))  # Optional: log this

# -----------------------------------------------------------
# ✅ Payment Route
# -----------------------------------------------------------
@router.post("/", response_model=schemas.PaymentResponse)
def make_payment(
    payment_data: schemas.PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Validate booking
    booking = db.query(models.Booking).filter(
        models.Booking.id == payment_data.booking_id,
        models.Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or unauthorized")

    if booking.status == BookingStatusEnum.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot pay for a cancelled booking")

    if booking.status == BookingStatusEnum.CONFIRMED:
        raise HTTPException(status_code=400, detail="Booking already confirmed")

    # 2. Validate amount
    expected_amount = booking.total_price
    if float(payment_data.amount) != float(expected_amount):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid payment amount. Expected: ₹{expected_amount}"
        )

    # 3. Create payment record
    payment = models.Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        car_id=booking.car_id,
        amount=payment_data.amount,
        payment_date=datetime.utcnow(),
        status=PaymentStatusEnum.SUCCESS,
        payment_gateway_id=payment_data.payment_gateway_id or "Cashfree"
    )

    # 4. Update booking status
    booking.status = BookingStatusEnum.CONFIRMED

    db.add(payment)
    db.commit()
    db.refresh(payment)
    db.refresh(booking)

    # 5. Enrich payment with extra fields
    payment.car_model = booking.car.model
    payment.car_brand = booking.car.brand
    payment.car_license_plate = booking.car.license_plate
    payment.car_year = booking.car.year
    payment.username = booking.user.name
    payment.car_start_date = booking.start_date
    payment.car_start_time = booking.start_time
    payment.car_end_date = booking.end_date
    payment.car_end_time = booking.end_time

    # 6. Send confirmation email
    send_booking_confirmation_email(
        name=booking.user.name,
        user_email=booking.user.email,
        payment_details=payment
    )

    return payment
