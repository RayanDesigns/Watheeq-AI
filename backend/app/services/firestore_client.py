import json
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings


def _init_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK if not already initialized."""
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass

    if settings.FIREBASE_SERVICE_ACCOUNT_KEY:
        # Full service account JSON provided as an env var string
        cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_KEY)
        cred = credentials.Certificate(cred_dict)
    elif settings.FIREBASE_CLIENT_EMAIL and settings.FIREBASE_PRIVATE_KEY:
        # Individual fields provided
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token",
        })
    else:
        raise RuntimeError(
            "Firebase credentials not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY "
            "or FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL in .env"
        )

    return firebase_admin.initialize_app(cred)


# Initialize on import so the app is ready before any request arrives
_init_firebase()


def get_db() -> firestore.Client:
    """Return a Firestore client instance."""
    return firestore.client()
