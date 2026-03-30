import re
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from firebase_admin import auth as firebase_auth
from app.services.firestore_client import get_db
from app.services import claims_service
from app.models.claim import SubmitClaimRequest
from app.utils import cloudinary_client

router = APIRouter()

MAX_MEDICAL_REPORT_SIZE = 15 * 1024 * 1024  # 15 MB


# ── Auth dependency ────────────────────────────────────────────────────────────

async def require_claimant(authorization: str = Header(..., alias="Authorization")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[7:]
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")

    db = get_db()
    snap = db.collection("users").document(decoded["uid"]).get()
    if not snap.exists:
        raise HTTPException(status_code=403, detail="User not found")

    profile = snap.to_dict()
    if profile.get("role") != "claimant":
        raise HTTPException(status_code=403, detail="Claimant access required")

    return {"uid": decoded["uid"], **profile}


async def require_authenticated(authorization: str = Header(..., alias="Authorization")) -> dict:
    """Allow any authenticated user (claimant or examiner) to download medical reports."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[7:]
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")

    db = get_db()
    snap = db.collection("users").document(decoded["uid"]).get()
    if not snap.exists:
        raise HTTPException(status_code=403, detail="User not found")

    return {"uid": decoded["uid"], **snap.to_dict()}


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/claims/upload-medical-report", summary="Upload a medical report PDF to Cloudinary")
async def upload_medical_report(
    file: UploadFile = File(...),
    user: dict = Depends(require_claimant),
):
    """Upload a PDF medical report; returns the Cloudinary URL for use in claim submission."""
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    if not filename.endswith(".pdf") or "pdf" not in content_type:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    file_bytes = await file.read()
    if len(file_bytes) > MAX_MEDICAL_REPORT_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 15 MB limit")
    import uuid
    uid_short = user["uid"][-8:]
    public_id = f"watheeq/medical-reports/{uid_short}_{uuid.uuid4().hex[:8]}"
    try:
        result = cloudinary_client.upload_file(file_bytes, public_id=public_id, resource_type="raw")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")
    return {"url": result["secure_url"]}


@router.post("/claims/upload-supporting-docs", summary="Upload a supporting documents PDF to Cloudinary")
async def upload_supporting_docs(
    file: UploadFile = File(...),
    user: dict = Depends(require_claimant),
):
    """Upload a PDF supporting document; returns the Cloudinary URL for use in claim submission."""
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    if not filename.endswith(".pdf") or "pdf" not in content_type:
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    file_bytes = await file.read()
    if len(file_bytes) > MAX_MEDICAL_REPORT_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 15 MB limit")
    import uuid
    uid_short = user["uid"][-8:]
    public_id = f"watheeq/supporting-documents/{uid_short}_{uuid.uuid4().hex[:8]}"
    try:
        result = cloudinary_client.upload_file(file_bytes, public_id=public_id, resource_type="raw")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")
    return {"url": result["secure_url"]}


@router.post("/claims", summary="Submit a new insurance claim", status_code=201)
def submit_claim(data: SubmitClaimRequest, user: dict = Depends(require_claimant)):
    """US1 & US2: Submit claim and receive a unique claim reference number."""
    return claims_service.submit_claim(user["uid"], data)


@router.get("/claims", summary="List all claims for the authenticated claimant")
def list_claims(user: dict = Depends(require_claimant)):
    """US3 & US4: View all claims and their statuses."""
    return claims_service.list_claims(user["uid"])


@router.get("/claims/{claim_id}", summary="Get a single claim by ID")
def get_claim(claim_id: str, user: dict = Depends(require_claimant)):
    return claims_service.get_claim(claim_id, user["uid"])


@router.patch("/claims/{claim_id}/cancel", summary="Cancel a submitted claim")
def cancel_claim(claim_id: str, user: dict = Depends(require_claimant)):
    """US5: Cancel a claim — only allowed when status is 'submitted'."""
    return claims_service.cancel_claim(claim_id, user["uid"])


@router.get("/claims/{claim_id}/download-medical-report", summary="Download medical report PDF from Cloudinary")
async def download_medical_report(claim_id: str, user: dict = Depends(require_authenticated)):
    """
    Stream the medical report PDF for a claim through the backend (bypassing Cloudinary restrictions).
    Accessible to: the claimant who owns the claim, or any active examiner assigned to it.
    """
    uid = user["uid"]
    role = user.get("role", "")

    db = get_db()
    snap = db.collection("claims").document(claim_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Claim not found")

    data = snap.to_dict()

    # Access control: claimant must own the claim; examiner must be assigned or claim must be submitted
    if role == "claimant":
        if data.get("claimantID") != uid:
            raise HTTPException(status_code=403, detail="You do not have access to this claim")
    elif role == "examiner":
        assigned = data.get("examinerID", "")
        status = data.get("status", "")
        if assigned != uid and not (status == "submitted" and assigned == ""):
            raise HTTPException(status_code=403, detail="You do not have access to this claim")
    else:
        # Admin or other roles — allow access
        pass

    file_url = data.get("medicalReport", "")
    if not file_url:
        raise HTTPException(status_code=404, detail="No medical report attached to this claim")

    patient_name = f"{data.get('patientFName', 'Medical')}-{data.get('patientLName', 'Report')}"

    # Extract public_id from the Cloudinary URL and stream it back
    match = re.search(r"/upload/(?:v\d+/)?(.+)$", file_url)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid medical report URL stored")

    public_id = match.group(1)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(file_url)
        if resp.status_code != 200:
            private_url = cloudinary_client.get_private_download_url(public_id)
            resp = await client.get(private_url)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Cloudinary {resp.status_code}: {resp.text[:300]}"
            )

    safe_name = patient_name.replace('"', "")
    return StreamingResponse(
        iter([resp.content]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}-Medical-Report.pdf"'},
    )
