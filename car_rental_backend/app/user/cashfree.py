# app/routes/users/cashfree.py

from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models import User, Booking
from app.database import get_db
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import requests
import uuid
from app.schemas import CashfreeSessionRequest

router = APIRouter()
load_dotenv()

CASHFREE_CLIENT_ID = os.getenv("CASHFREE_CLIENT_ID")
CASHFREE_CLIENT_SECRET = os.getenv("CASHFREE_CLIENT_SECRET")
CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg"  # Use "https://api.cashfree.com/pg" in production

@router.post("/")
def create_cashfree_session(
    data: CashfreeSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking_id = data.booking_id
    amount = data.amount

    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    order_id = f"ORDER_{uuid.uuid4().hex[:10]}"

    payload = {
        "customer_details": {
            "customer_id": str(current_user.id),
            "customer_email": current_user.email,
            "customer_phone": "9999999999", 
        },
        "order_id": order_id,
        "order_amount": amount,
        "order_currency": "INR",
    }

    headers = {
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET,
        "x-api-version": "2022-09-01",  # ✅ This fixes 404
        "Content-Type": "application/json"
    }

    res = requests.post(
        f"{CASHFREE_BASE_URL}/orders",  # 👈 Should be https://sandbox.cashfree.com/pg/orders
        json=payload,
        headers=headers
    )

    if res.status_code != 200:
        print("Cashfree Error:", res.status_code, res.text)
        raise HTTPException(status_code=500, detail="Failed to create payment session")

    session_data = res.json()
    return {
        "payment_session_id": session_data["payment_session_id"],
        "order_id": session_data["order_id"],
    }

