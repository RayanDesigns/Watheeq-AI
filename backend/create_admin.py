"""
Run once to create the dummy admin account.
Usage (from the backend folder):
    python create_admin.py
"""
import sys
import os

# Make sure app packages are importable
sys.path.insert(0, os.path.dirname(__file__))

from app.services.firestore_client import get_db   # also initialises Firebase Admin
from firebase_admin import auth as firebase_auth
from datetime import datetime, timezone

ADMIN_EMAIL    = "admin@watheeq.ai"
ADMIN_PASSWORD = "Admin@1234"
ADMIN_NAME     = "Watheeq Admin"


def main():
    # 1. Create (or fetch) the Firebase Auth user
    try:
        user = firebase_auth.get_user_by_email(ADMIN_EMAIL)
        print(f"[Auth] User already exists: uid={user.uid}")
    except firebase_auth.UserNotFoundError:
        user = firebase_auth.create_user(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            display_name=ADMIN_NAME,
        )
        print(f"[Auth] Created user: uid={user.uid}")

    uid = user.uid

    # 2. Write / overwrite the Firestore profile
    db = get_db()
    profile = {
        "uid": uid,
        "email": ADMIN_EMAIL,
        "fullName": ADMIN_NAME,
        "role": "admin",
        "status": "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db.collection("users").document(uid).set(profile)
    print(f"[Firestore] Profile written at users/{uid}")

    print("\nDone! Credentials:")
    print(f"  Email   : {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")


if __name__ == "__main__":
    main()
