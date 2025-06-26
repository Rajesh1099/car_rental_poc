# app/schemas.py

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from enum import Enum
from datetime import datetime, date, time



# -------------------------------
# ✅ USER SCHEMAS
# -------------------------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class ShowUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    is_verified: bool
    is_admin: bool

    class Config:
        orm_mode = True

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    is_admin: bool
    is_verified: bool

    class Config:
        orm_mode = True        

class DisplayUserInfoAdmin(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        orm_mode = True

class DisplayUserInfo(BaseModel):
    name: str
    email: EmailStr

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

# -------------------------------
# ✅ CAR SCHEMAS
# -------------------------------

class CarCreate(BaseModel):
    brand: str
    model: str
    engine_type:str 
    transmission_type:str
    car_type:str
    seater:str
    year: int
    license_plate: str
    city: str
    price_per_day: int
    image_url: Optional[str]


class CarUpdate(BaseModel):
    brand: Optional[str]=None
    model: Optional[str]=None
    engine_type:Optional[str]=None
    transmission_type:Optional[str]=None
    car_type:Optional[str]=None
    seater:Optional[str]=None
    year: Optional[int]=None
    license_plate: Optional[str]=None
    city: Optional[str]=None
    is_available: Optional[bool]=None
    price_per_day: Optional[int]=None
    image_url: Optional[str]=None

    class Config:
        orm_mode = True

class CarResponse(BaseModel):
    id: int
    brand: str
    model: str
    engine_type:str 
    transmission_type:str
    car_type:str
    seater:str
    year: int
    license_plate: str
    city: str
    is_available: bool
    price_per_day: int
    image_url: Optional[str] 

    class Config:
        orm_mode = True

class CarInfoAdmin(BaseModel):
    id: int
    brand: str
    model: str
    year: int
    license_plate: str
    city: str
    image_url: Optional[str]

    class Config:
        orm_mode = True

class CarInfo(BaseModel):
    id: int
    brand: str
    model: str
    engine_type: str
    transmission_type: str
    car_type: str
    seater: str
    year: int
    license_plate: str
    city: str
    is_available: bool
    price_per_day: int
    image_url: Optional[str]

    class Config:
        orm_mode = True


# -------------------------------
# ✅ BOOKING SCHEMAS
# -------------------------------

class BookingStatus(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class BookingCreate(BaseModel):
    car_id: int
    start_date: date
    start_time: time
    end_date: date
    end_time: time
    duration_hours: Optional[int] = None
    home_delivery: Optional[bool] = False
    coupon_code: Optional[str] = None
    base_price: Optional[float] = 0
    gst: Optional[float] = 0
    insurance: Optional[float] = 0
    delivery_charge: Optional[float] = 0
    discount: Optional[float] = 0
    total_price: Optional[float] = 0


class BookingResponse(BaseModel):
    id: int
    car_id: int
    user_id: int
    start_date: date
    start_time: time
    end_date: date
    end_time: time
    status: str
    car: CarInfo

    duration_hours: Optional[int]
    home_delivery: Optional[bool]
    coupon_code: Optional[str]
    base_price: Optional[float]
    gst: Optional[float]
    insurance: Optional[float]
    delivery_charge: Optional[float]
    discount: Optional[float]
    total_price: Optional[float]

    class Config:
        orm_mode = True


class BookingResponseUser(BaseModel):
    id: int
    start_date: date
    start_time: time
    end_date: date
    end_time: time
    status: str


    class Config:
        orm_mode = True

class ShowBooking(BaseModel):
    id: int
    user_id: int
    car_id: int
    date: datetime
    status: BookingStatus

    class Config:
        orm_mode = True

# ✅ Nested Payment schema
class PaymentInfo(BaseModel):
    id: int
    amount: float
    status: str
    payment_gateway_id: str
    payment_date: datetime

   

    class Config:
        orm_mode = True

# ✅ Booking with full details
class BookingWithDetailsAdmin(BaseModel):
    id: int
    start_date: date
    start_time: time
    end_date: date
    end_time: time
    status: BookingStatus
    car: CarInfoAdmin
    user: DisplayUserInfoAdmin
    payments: List[PaymentInfo]

    

    class Config:
        orm_mode = True

class BookingWithDetails(BaseModel):
    id: int
    start_date: date
    start_time: time
    end_date: date
    end_time: time
    status: BookingStatus
    car: CarInfo
    user: DisplayUserInfo
    payments: List[PaymentInfo]

    

    class Config:
        orm_mode = True

# -------------------------------
# ✅ PAYMENT SCHEMAS
# -------------------------------

class PaymentStatus(str, Enum):
    PENDING = "Pending"
    PAID = "Paid"
    CANCELLED = "Cancelled"

class PaymentStatusUpdate(BaseModel):
    status: PaymentStatus

class PaymentCreate(BaseModel):
    booking_id: int
    amount: float
    payment_gateway_id: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    car_id: int
    amount: float
    payment_date: datetime
    status: str
    payment_gateway_id: str

    car_model: Optional[str]
    car_brand: Optional[str]
    car_license_plate: Optional[str]
    car_year: Optional[int]
    username: Optional[str]

    

    class Config:
        orm_mode = True

class ShowPayment(BaseModel):
    id: int
    user_id: int
    car_id: int
    booking_id: int
    amount: float
    date: datetime
    status: PaymentStatus

    class Config:
        orm_mode = True

class PaymentWithDetailsAdmin(BaseModel):
    id: int
    amount: float
    payment_date: datetime
    status: str
    payment_gateway_id: str
    user: DisplayUserInfoAdmin
    car: CarInfoAdmin
    booking: BookingResponse

   

    class Config:
        orm_mode = True

class PaymentWithDetails(BaseModel):
    id: int
    amount: float
    payment_date: datetime
    status: str
    payment_gateway_id: str
    user: DisplayUserInfo
    car: CarInfo
    booking: BookingResponseUser
    
    

    class Config:
        orm_mode = True



# schemas.py

from pydantic import BaseModel
from datetime import date, time

class EmailPaymentDetails(BaseModel):
    booking_id: int
    amount: float
    car_brand: str
    car_model: str
    car_license_plate: str
    car_year: int
    car_start_date: date
    car_end_date: date
    car_start_time: time
    car_end_time: time
    payment_gateway_id: str
    status: str

    class Config:
        orm_mode = True



class CashfreeSessionRequest(BaseModel):
    booking_id: int
    amount: float