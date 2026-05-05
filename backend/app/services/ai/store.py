"""
Persistence layer for AI analysis.

Reuses the existing Firestore client (no second Firebase init).
Writes aiDecision / aiMessage / aiDraft / aiDraftOriginal back to the claim doc
so results survive restarts; keeps an in-memory cache for fast GET-by-claim.
"""

import logging
import threading
from typing import Optional

from app.services.firestore_client import get_db

logger = logging.getLogger(__name__)

# In-memory caches (per-process — survive within a single uvicorn worker only)
_analysis_cache: dict[str, dict] = {}
_draft_cache: dict[str, dict] = {}
_lock = threading.Lock()


# ── Claim helpers ─────────────────────────────────────────────────────────────


def get_claim(claim_id: str) -> Optional[dict]:
    try:
        doc = get_db().collection("claims").document(claim_id).get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        logger.error(f"Failed to read claim {claim_id}: {e}")
        return None


def get_policy_by_name(policy_name: str) -> Optional[dict]:
    """Match against the policies collection. Tries exact, lowercase, then a partial scan."""
    try:
        db = get_db()

        docs = db.collection("policies").where("policy_name", "==", policy_name).limit(1).get()
        if docs:
            return docs[0].to_dict()

        docs = db.collection("policies").where("policy_name", "==", policy_name.lower()).limit(1).get()
        if docs:
            return docs[0].to_dict()

        search = policy_name.lower()
        for doc in db.collection("policies").stream():
            data = doc.to_dict()
            name = (data.get("policy_name") or "").lower()
            if name == search or search in name or name in search:
                logger.info(f"Found policy via partial match: '{data.get('policy_name')}'")
                return data

        logger.warning(f"No policy found matching '{policy_name}'")
        return None
    except Exception as e:
        logger.error(f"Failed to look up policy '{policy_name}': {e}")
        return None


def update_claim_with_ai_result(
    claim_id: str,
    ai_decision: str,
    ai_message: str,
    ai_draft: str,
    ai_draft_original: str,
    ai_confidence: Optional[float] = None,
    ai_clauses: Optional[list] = None,
    ai_flags: Optional[list] = None,
) -> bool:
    """Persist AI outputs onto the existing claim document.

    Stores both the human-readable summary fields (decision/message/draft) and
    the structured fields (confidence, clauses, flags) so the examiner UI can
    rehydrate the full panel on reload — even after the in-memory cache is gone.
    """
    try:
        ref = get_db().collection("claims").document(claim_id)
        if not ref.get().exists:
            logger.error(f"Claim {claim_id} not found when writing AI result")
            return False

        update: dict = {
            "aiDecision": ai_decision,
            "aiMessage": ai_message,
            "aiDraft": ai_draft,
            "aiDraftOriginal": ai_draft_original,
        }
        if ai_confidence is not None:
            update["aiConfidence"] = ai_confidence
        if ai_clauses is not None:
            update["aiClauses"] = ai_clauses
        if ai_flags is not None:
            update["aiFlags"] = ai_flags

        ref.update(update)
        logger.info(
            f"Claim {claim_id} updated with AI result "
            f"(decision={ai_decision}, confidence={ai_confidence})"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to update claim {claim_id} with AI result: {e}")
        return False


def update_claim_draft_only(claim_id: str, ai_draft: str) -> bool:
    """Update only the editable draft (used by PUT /draft)."""
    try:
        ref = get_db().collection("claims").document(claim_id)
        if not ref.get().exists:
            return False
        ref.update({"aiDraft": ai_draft})
        return True
    except Exception as e:
        logger.error(f"Failed to update aiDraft for claim {claim_id}: {e}")
        return False


# ── Analysis cache (per-claim) ────────────────────────────────────────────────


def save_analysis(claim_id: str, data: dict) -> None:
    with _lock:
        _analysis_cache[claim_id] = data


def get_analysis(claim_id: str) -> Optional[dict]:
    with _lock:
        return _analysis_cache.get(claim_id)


# ── Draft cache (per-claim) ───────────────────────────────────────────────────


def save_draft(claim_id: str, data: dict) -> None:
    with _lock:
        _draft_cache[claim_id] = data


def get_draft(claim_id: str) -> Optional[dict]:
    with _lock:
        return _draft_cache.get(claim_id)


def clear_all() -> None:
    """Test helper — clear in-memory state."""
    with _lock:
        _analysis_cache.clear()
        _draft_cache.clear()
