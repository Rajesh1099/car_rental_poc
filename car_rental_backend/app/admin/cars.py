# app/admin/cars.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models, database, schemas
from app.auth import get_current_user
from typing import Optional as optional

router = APIRouter()

# ✅ Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to check admin access
def admin_required(user=Depends(get_current_user)):
    """
    Dependency function to ensure the current user is an admin.
    Raises 403 if user is not admin.
    """
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user        

# ➕ Create a new car
@router.post("/create-car", response_model=schemas.CarResponse, status_code=status.HTTP_201_CREATED)
def create_car(car: schemas.CarCreate, db: Session = Depends(get_db),user=Depends(admin_required)):
    # 🚫 Check if license_plate already exists
    existing_car = db.query(models.Car).filter(models.Car.license_plate == car.license_plate).first()
    if existing_car:
        raise HTTPException(status_code=400, detail="Car with this license plate already exists.")

    db_car = models.Car(**car.dict())
    db.add(db_car)
    db.commit()
    db.refresh(db_car)
    return db_car

# 📋 Get all cars
@router.get("/", response_model=list[schemas.CarResponse])
def get_all_cars(
    car_id: optional[int] = None,
    car_license_plate: optional[str] = None,
    car_model: optional[str] = None,
    car_brand: optional[str] = None,
    car_year: optional[int] = None,
    db: Session = Depends(get_db),user=Depends(admin_required)):
    
    if car_id:
        cars = db.query(models.Car).filter(models.Car.id == car_id).all()
    elif car_license_plate:
        cars = db.query(models.Car).filter(models.Car.license_plate == car_license_plate).all()
    elif car_model:
        cars = db.query(models.Car).filter(models.Car.model == car_model).all()
    elif car_brand:
        cars = db.query(models.Car).filter(models.Car.brand == car_brand).all()
    elif car_year:
        cars = db.query(models.Car).filter(models.Car.year == car_year).all()
    else:
        cars = db.query(models.Car).all()
    if not cars:
        raise HTTPException(status_code=404, detail="No cars found")
    return cars

# 🔍 Get a car by ID
@router.get("/{car_id}", response_model=schemas.CarResponse)
def get_car_by_id(car_id: int, db: Session = Depends(get_db),user=Depends(admin_required)):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

# ✏️ Update a car
@router.put("/{car_id}/update", response_model=schemas.CarResponse)
def update_car(car_id: int, updated_car: schemas.CarUpdate, db: Session = Depends(get_db),user=Depends(admin_required)):
    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    # If updating license_plate, check for uniqueness
    if updated_car.license_plate:
        existing_car = db.query(models.Car).filter(
            models.Car.license_plate == updated_car.license_plate,
            models.Car.id != car_id  # ignore current car
        ).first()
        if existing_car:
            raise HTTPException(status_code=400, detail="Another car with this license plate already exists.")

    for key, value in updated_car.dict(exclude_unset=True).items():
        setattr(car, key, value)

    db.commit()
    db.refresh(car)
    return car

from fastapi import Body

# ❌ Delete a car
@router.delete("/{car_id}/delete", status_code=status.HTTP_200_OK)
def delete_car(
    car_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    user=Depends(admin_required)
):
    car_license_plate = payload.get("car_license_plate")

    if not car_license_plate:
        raise HTTPException(status_code=400, detail="License plate is required")

    car = db.query(models.Car).filter(models.Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    if car.license_plate != car_license_plate:
        raise HTTPException(status_code=400, detail="License plate does not match the car ID")

    db.delete(car)
    db.commit()
    return {
        "detail": f"Car with ID: '{car_id}' and license plate: '{car_license_plate}' deleted successfully"
    }
