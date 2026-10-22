
from getpass import getpass

from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import hash_password


email = input(
    "Account email [student@example.com]: "
).strip().lower()

if not email:
    email = "student@example.com"

password = getpass("New password (minimum 8 characters): ")

if len(password) < 8:
    raise SystemExit("Password must be at least 8 characters.")

confirmation = getpass("Confirm new password: ")

if password != confirmation:
    raise SystemExit("Passwords do not match. No changes made.")

db = SessionLocal()

try:
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise SystemExit("Account not found. No changes made.")

    user.hashed_password = hash_password(password)
    db.commit()

    print("Password reset successfully.")
    print("Your existing learning statistics are unchanged.")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
