# create_admin.py

import sys
from app.database import SessionLocal, engine
from app import models, utils

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(models.User).filter(models.User.is_admin == True).first()
        if admin:
            print("Admin user already exists.")
            return

        name = "Admin User"
        email = "admin@example.com"  # Change to your admin email
        password = "adminpassword"   # Change to a strong password

        hashed_password = utils.hash_password(password)

        admin_user = models.User(
            name=name,
            email=email,
            hashed_password=hashed_password,
            is_verified=True,
            is_admin=True,
        )

        db.add(admin_user)
        db.commit()
        print(f"Admin user created successfully: {email}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
