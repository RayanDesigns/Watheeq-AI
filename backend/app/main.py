import sys
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import auth
from app.core.config import settings

app = FastAPI(
    title="Watheeq AI API",
    version="0.1.0",
    description="Backend API for Watheeq AI insurance claims management platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return the real error message for any unhandled exception (dev mode)."""
    tb = traceback.format_exc()
    print(f"[UNHANDLED ERROR] {exc}\n{tb}", file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )


@app.get("/")
async def root():
    return {"status": "ok", "service": "Watheeq AI API"}
