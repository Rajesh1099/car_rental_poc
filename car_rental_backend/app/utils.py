# app/utils.py

from passlib.context import CryptContext
import secrets

# Create a password context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash the password using bcrypt
def hash_password(password: str):
    return pwd_context.hash(password)

# Verify if the plain password matches the hashed one
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)



def random_password(length=12):
    return secrets.token_urlsafe(length)


