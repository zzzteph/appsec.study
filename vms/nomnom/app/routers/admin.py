import traceback
from fastapi import APIRouter, HTTPException, Depends
from ..auth import current_user
from .. import db

router = APIRouter(tags=["Admin & Misc"])


# VULN[debug-auth-test] — a leftover debug endpoint that hands out valid
# credentials and a ready-to-use token for any account, defaulting to the admin.
# Anyone who finds it gets instant admin access. Should never ship.
@router.get("/api/auth-test")
def auth_test(user: str = "u3"):
    u = db.users_by_id.get(user) or db.users_by_id.get("u3")
    return {
        "user_id": u["id"],
        "email": u["email"],
        "password": u["password"],
        "role": u["role"],
        "token": u["id"],
        "authorization": f"Bearer {u['id']}",
    }


@router.get("/admin/stats")
def admin_stats(user=Depends(current_user)):
    # VULN[bfla] no admin-role check on any /admin/* route below
    return {"users": len(db.users), "orders": len(db.orders),
            "revenue": round(sum(o["total"] for o in db.orders), 2)}


@router.get("/admin/users")
def admin_users(user=Depends(current_user)):
    return db.users  # VULN[bfla] + VULN[excessive-data]


@router.get("/admin/orders")
def admin_orders(user=Depends(current_user)):
    return db.orders


@router.post("/admin/users/{uid}/promote")
def promote_user(uid: str, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    u["role"] = "admin"  # VULN[bfla] any caller can grant admin
    return u


@router.get("/admin/config")
def admin_config(user=Depends(current_user)):
    # VULN[secrets] leaks application secrets
    return {"db": "in-memory", "stripe_key": "sk_live_51NomNomDoNotShare",
            "jwt_secret": "nomnom-super-secret-key"}


@router.get("/admin/export")
def admin_export(user=Depends(current_user)):
    return {"users": db.users, "orders": db.orders, "payments": db.payments}  # VULN[excessive-data]


@router.get("/notifications")
def list_notifications(user=Depends(current_user)):
    return [n for n in db.notifications if n["user_id"] == user["id"]]


@router.patch("/notifications/{nid}/read")
def mark_read(nid: int, user=Depends(current_user)):
    n = db.find(db.notifications, "id", nid)
    if not n:
        raise HTTPException(404, "not found")
    n["read"] = True
    return n


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/version")
def version(debug: bool = False):
    if debug:
        # VULN[verbose-error] debug flag dumps a stack trace + internal state
        try:
            raise RuntimeError("debug trace requested")
        except Exception:
            return {"version": "1.0.0", "trace": traceback.format_exc(),
                    "users_loaded": len(db.users)}
    return {"version": "1.0.0"}
