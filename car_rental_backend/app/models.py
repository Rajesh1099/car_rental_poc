from sqlalchemy import Column, Integer, String, Boolean, Date, Time, DateTime, Float, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum
from .database import Base

# Enums
class BookingStatusEnum(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    PAID = "Paid"

class PaymentStatusEnum(str, Enum):
    SUCCESS = "Success"
    PENDING = "Pending"
    CANCELLED = "Cancelled"

# User Table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Relationships
    bookings = relationship("Booking", back_populates="user", cascade="all, delete")
    payments = relationship("Payment", back_populates="user", cascade="all, delete")

# Car Table
class Car(Base):
    __tablename__ = "cars"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String)
    model = Column(String)
    year = Column(Integer)
    license_plate = Column(String, unique=True)
    city = Column(String)
    is_available = Column(Boolean, default=True)
    price_per_day = Column(Integer)
    image_url = Column(String, nullable=True) 
    engine_type=Column(String)
    transmission_type=Column(String)
    car_type=Column(String)
    seater=Column(String)

    # Relationships
    bookings = relationship("Booking", back_populates="car", cascade="all, delete")

# Booking Table
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))
    start_date = Column(Date)
    start_time = Column(Time)
    end_date = Column(Date)
    end_time = Column(Time)
    status = Column(SqlEnum(BookingStatusEnum), default=BookingStatusEnum.PENDING)

    # ✅ Newly added pricing & details
    duration_hours = Column(Integer)
    home_delivery = Column(Boolean, default=False)
    coupon_code = Column(String, nullable=True)
    base_price = Column(Float)
    gst = Column(Float)
    insurance = Column(Float)
    delivery_charge = Column(Float)
    discount = Column(Float)
    total_price = Column(Float)


    # Relationships
    user = relationship("User", back_populates="bookings")
    car = relationship("Car", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    car_id = Column(Integer, ForeignKey("cars.id"))  
    amount = Column(Float)
    payment_date = Column(DateTime, default=datetime.utcnow)
    status = Column(SqlEnum(PaymentStatusEnum), default=PaymentStatusEnum.SUCCESS)
    payment_gateway_id = Column(String, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="payments")
    user = relationship("User", back_populates="payments")
    car = relationship("Car")  
