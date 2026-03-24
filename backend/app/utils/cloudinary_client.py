"""
Cloudinary utility — reusable file upload/delete helpers.

Folder conventions:
  Policy plans      → watheeq/policies/
  Medical reports   → watheeq/medical-reports/claim_{id}/
  Supporting docs   → watheeq/supporting-documents/claim_{id}/
"""
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from app.core.config import settings


def _init():
    """Configure Cloudinary from environment variables."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


def upload_file(file_bytes: bytes, public_id: str, resource_type: str = "raw") -> dict:
    """
    Upload raw bytes to Cloudinary.

    Args:
        file_bytes: Raw file content.
        public_id: Full Cloudinary path, e.g. "watheeq/policies/abc123_report.pdf".
        resource_type: "raw" for PDFs/docs, "image" for images, "video" for video.

    Returns:
        Cloudinary upload result dict (includes secure_url, public_id, bytes, etc.)
    """
    _init()
    return cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        resource_type=resource_type,
        type="upload",
        access_mode="public",
        access_control=[{"access_type": "anonymous"}],
        overwrite=False,
    )


def get_private_download_url(public_id: str, resource_type: str = "raw") -> str:
    """
    Generate a Cloudinary private download URL using the API endpoint.
    This goes through api.cloudinary.com (not the CDN) and bypasses
    any delivery restrictions set on the account or resource.
    """
    _init()
    return cloudinary.utils.private_download_url(
        public_id,
        "",  # format — empty string for raw files
        resource_type=resource_type,
        attachment=True,
        expires_at=int(__import__("time").time()) + 3600,
    )


def get_signed_url(public_id: str, resource_type: str = "raw") -> str:
    """
    Generate a signed Cloudinary URL that bypasses access restrictions.
    Use this when the direct secure_url returns 401.
    """
    _init()
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        sign_url=True,
        secure=True,
    )
    return url


def delete_file(public_id: str, resource_type: str = "raw") -> dict:
    """
    Delete a file from Cloudinary by its public_id.

    Args:
        public_id: The full Cloudinary public_id (as stored in Firestore).
        resource_type: Must match the resource_type used during upload.

    Returns:
        Cloudinary deletion result dict.
    """
    _init()
    return cloudinary.uploader.destroy(public_id, resource_type=resource_type)
