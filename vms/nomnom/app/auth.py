from typing import Optional
from fastapi import Depends, Query, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from . import db

# Registering HTTPBearer as a dependency makes the authenticated endpoints show
# the padlock + "Authorize" button in Swagger UI, and leaves the public ones
# (no dependency) lock-free — the same public/authenticated split boxcutter uses.
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Bearer token = a user id (e.g. `u1`). Grab one from GET /api/auth-test.",
)


# VULN[forgeable-token] — the bearer "token" is just the user id, unsigned. Any
# client can authenticate as any user by sending its id (e.g. `Bearer u3` to
# become the admin); `?token=` is also accepted. This powers the BOLA demos.
def current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    token: Optional[str] = Query(None),
):
    raw = creds.credentials if creds and creds.credentials else token
    if not raw:
        raise HTTPException(status_code=401, detail="not authenticated (Authorize with a user id, e.g. u1)")
    user = db.users_by_id.get(raw)
    if not user:
        raise HTTPException(status_code=401, detail="invalid token")
    return user


def optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    token: Optional[str] = Query(None),
):
    try:
        return current_user(creds, token)
    except HTTPException:
        return None
