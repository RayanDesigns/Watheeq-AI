"""
In-process pub/sub for AI analysis progress events.

Each analysis run is keyed by claim_id. Producers (the background
run_analysis pipeline + the streaming Gemini call) publish events;
the SSE/NDJSON endpoint subscribes and replays the buffer first so
late subscribers still see the full stream.

Thread-safety: publish() can be called from any thread (the Gemini
streaming generator runs in a worker thread via asyncio.to_thread);
subscriber queues are bridged onto the running event loop using
loop.call_soon_threadsafe.
"""

import asyncio
import logging
import threading
import time
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

# Drop completed runs older than this many seconds so memory doesn't grow forever
_TTL_SECONDS = 60 * 30


class EventBroker:
    def __init__(self) -> None:
        self._buffers: dict[str, list[dict]] = {}
        self._subscribers: dict[str, list[asyncio.Queue]] = {}
        self._completed_at: dict[str, float] = {}
        self._lock = threading.Lock()

    # ── Producer API ──────────────────────────────────────────────────────────
    def publish(self, claim_id: str, event: dict) -> None:
        """Publish an event for a claim. Safe to call from any thread."""
        with self._lock:
            self._buffers.setdefault(claim_id, []).append(event)
            queues = list(self._subscribers.get(claim_id, []))
            if event.get("type") in ("complete", "error"):
                self._completed_at[claim_id] = time.time()
            self._gc_locked()

        for q, loop in queues:
            try:
                if loop and loop.is_running():
                    loop.call_soon_threadsafe(q.put_nowait, event)
                else:
                    q.put_nowait(event)
            except Exception as e:
                logger.warning(f"Failed to deliver event to subscriber for {claim_id}: {e}")

    def reset(self, claim_id: str) -> None:
        """Clear buffered events for a claim — call when a fresh analysis starts."""
        with self._lock:
            self._buffers.pop(claim_id, None)
            self._completed_at.pop(claim_id, None)

    # ── Subscriber API ────────────────────────────────────────────────────────
    async def subscribe(self, claim_id: str) -> AsyncIterator[dict]:
        """Yield buffered + new events for a claim until 'complete' or 'error'."""
        loop = asyncio.get_running_loop()
        q: asyncio.Queue = asyncio.Queue()

        with self._lock:
            buffered = list(self._buffers.get(claim_id, []))
            already_done = claim_id in self._completed_at
            self._subscribers.setdefault(claim_id, []).append((q, loop))

        try:
            for ev in buffered:
                yield ev

            if already_done:
                return

            while True:
                ev = await q.get()
                yield ev
                if ev.get("type") in ("complete", "error"):
                    return
        finally:
            with self._lock:
                subs = self._subscribers.get(claim_id, [])
                self._subscribers[claim_id] = [(qq, ll) for (qq, ll) in subs if qq is not q]
                if not self._subscribers[claim_id]:
                    self._subscribers.pop(claim_id, None)

    # ── Internal ──────────────────────────────────────────────────────────────
    def _gc_locked(self) -> None:
        now = time.time()
        stale = [cid for cid, ts in self._completed_at.items() if now - ts > _TTL_SECONDS]
        for cid in stale:
            self._buffers.pop(cid, None)
            self._completed_at.pop(cid, None)


broker = EventBroker()
