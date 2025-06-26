from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.auth import get_current_user
from app import models, schemas
from app.database import get_db
from datetime import datetime
from app.models import BookingStatusEnum

router = APIRouter()

def strip_timezone(dt_str: str) -> datetime:
    """Converts ISO datetime string to naive datetime (removes timezone info)."""
    if dt_str.endswith("Z"):
        dt_str = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(dt_str)
    return dt.replace(tzinfo=None)

@router.get("/", response_model=List[schemas.CarResponse])
def get_available_cars(
    city: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    start_datetime = None
    end_datetime = None

    # Convert date + time strings into full naive datetime objects
    if start_date and start_time:
        start_datetime = strip_timezone(f"{start_date}T{start_time}")
    if end_date and end_time:
        end_datetime = strip_timezone(f"{end_date}T{end_time}")

    query = db.query(models.Car)
    if city:
        query = query.filter(models.Car.city.ilike(city))

    all_cars = query.all()

    if start_datetime and end_datetime:
        from sqlalchemy import and_, or_, func

        # Get car IDs with conflicting bookings (not cancelled)
        conflict_car_ids = db.query(models.Booking.car_id).filter(
            models.Booking.status != BookingStatusEnum.CANCELLED,
            or_(
                and_(
                    func.datetime(models.Booking.start_date, models.Booking.start_time) < end_datetime,
                    func.datetime(models.Booking.end_date, models.Booking.end_time) > start_datetime,
                ),
                and_(
                    func.datetime(models.Booking.start_date, models.Booking.start_time) < end_datetime,
                    func.datetime(models.Booking.end_date, models.Booking.end_time) > start_datetime,
                )
            )
        ).distinct().all()

        booked_ids = [car_id for (car_id,) in conflict_car_ids]
        all_cars = [car for car in all_cars if car.id not in booked_ids]

    if not all_cars:
        raise HTTPException(status_code=404, detail="No cars found for selected dates")

    return all_cars
