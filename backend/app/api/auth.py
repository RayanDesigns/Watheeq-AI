from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import auth_service

router = APIRouter()


# ── Request models ──────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    phone: str
    context: str = "login"   # "login" | "register"
    national_id: Optional[str] = None
    email: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str


class SignupRequest(BaseModel):
    phone: str
    full_name: str
    role: str                        # "claimant" | "examiner"
    national_id: Optional[str] = None
    email: Optional[str] = None
    hospital_name: Optional[str] = None
    organization: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send-otp", summary="Send OTP via Authentica SMS")
async def send_otp(req: SendOtpRequest):
    """
    Send a one-time password to the given Saudi phone number (+9665XXXXXXXX).
    Delegates to the Authentica API.
    """
    return await auth_service.send_otp(req.phone, context=req.context, national_id=req.national_id, email=req.email)


@router.post("/verify-otp", summary="Verify OTP and return Firebase custom token")
async def verify_otp(req: VerifyOtpRequest):
    """
    Verify the OTP. Returns:
    - `{ verified: true, is_new_user: true }` if the phone has no account yet.
    - `{ verified: true, token, role }` for existing active users.
    - 403 for pending examiners or rejected accounts.
    """
    return await auth_service.verify_otp(req.phone, req.otp)


@router.post("/signup", summary="Register a new claimant or examiner")
async def signup(req: SignupRequest):
    """
    Create a Firebase Auth user and a Firestore profile.
    - Claimants: returns a custom token for immediate sign-in.
    - Examiners: returns a pending-approval message.
    """
    return await auth_service.signup(
        phone=req.phone,
        full_name=req.full_name,
        role=req.role,
        national_id=req.national_id,
        email=req.email,
        hospital_name=req.hospital_name,
        organization=req.organization,
    )


@router.get("/me", summary="Get current authenticated user's profile")
async def get_me(authorization: str = Header(..., alias="Authorization")):
    """
    Verify the Firebase ID token in the `Authorization: Bearer <token>` header
    and return the user's Firestore profile.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header must be 'Bearer <token>'")
    id_token = authorization[len("Bearer "):]
    return await auth_service.get_current_user(id_token)
