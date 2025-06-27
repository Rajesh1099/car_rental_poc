from fastapi import FastAPI
from app.auth import router as auth_router
from app.admin_main import router as admin_router
from app.admin.bookings import router as bookings_router
from app.admin.cars import router as cars_router
from app.admin.payments import router as payments_router
from app.admin.users import router as admin_users_router
from app.user_main import router as user_router
from app.user.cars import router as user_cars_router
from app.user.bookings import router as user_bookings_router
from app.user.payments import router as user_payments_router
from fastapi.middleware.cors import CORSMiddleware
from app import models, database


# Create all tables before app starts (only do this in dev, use migrations in prod)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Allow your React frontend origin during development
origins = [
    "http://localhost:5173",  # React dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # or ["*"] to allow all (not recommended in production)
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

# Register routers with prefixes and tags
app.include_router(auth_router,tags=["Auth"])
app.include_router(admin_router, prefix="/admin", tags=["Admin"])
app.include_router(admin_users_router, prefix="/admin/users", tags=["Admin Users"])
app.include_router(bookings_router, prefix="/admin/bookings", tags=["Admin Bookings"])
app.include_router(cars_router, prefix="/admin/cars", tags=["Admin Cars"])
app.include_router(payments_router, prefix="/admin/payments", tags=["Admin Payments"])
app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(user_cars_router, prefix="/user/cars", tags=["User Cars"])
app.include_router(user_bookings_router, prefix="/user/bookings", tags=["User Bookings"])
app.include_router(user_payments_router, prefix="/user/payments", tags=["User Payments"])


@app.get("/")
def read_root():
    return {"message": "BoomBoomCars backend is running"}

