from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import RegisterIn, LoginIn, PasswordResetIn

router = APIRouter(tags=["Auth"])


@router.post("/auth/register")
def register(body: RegisterIn):
    if db.find(db.users, "email", body.email):
        raise HTTPException(409, "email already registered")  # VULN[user-enum]
    uid = db.new_user_id()
    user = {"id": uid, "name": body.name, "email": body.email, "password": body.password,
            "role": "customer", "referral_code": uid.upper(), "wallet": 0.0,
            "addresses": [], "payment_methods": []}
    db.users.append(user)
    db.users_by_id[uid] = user
    if body.referral_code:
        ref = db.find(db.referrals, "code", body.referral_code)
        if ref:
            ref["redeemed_by"].append(uid)
            owner = db.users_by_id.get(ref["owner_id"])
            if owner:
                owner["wallet"] += 5.0
    return {"token": uid, "user": user}  # VULN[forgeable-token]


@router.post("/auth/login")
def login(body: LoginIn):
    user = db.find(db.users, "email", body.email)
    # VULN[no-rate-limit] no throttling; VULN[user-enum] distinct messages
    if not user:
        raise HTTPException(404, "no account with that email")
    if user["password"] != body.password:
        raise HTTPException(401, "incorrect password")
    return {"token": user["id"], "user": user}


@router.post("/auth/refresh")
def refresh(user=Depends(current_user)):
    return {"token": user["id"]}


@router.post("/auth/logout")
def logout(user=Depends(current_user)):
    return {"ok": True}


@router.get("/auth/me")
def me(user=Depends(current_user)):
    return user  # VULN[excessive-data] returns password, payment methods, etc.


@router.post("/auth/forgot-password")
def forgot(body: PasswordResetIn):
    user = db.find(db.users, "email", body.email)
    # VULN[reset-token-weak] predictable token; VULN[info-disclosure] returned in body
    token = user["id"][::-1] if user else "x"
    return {"reset_token": token}


@router.post("/auth/reset-password")
def reset(body: PasswordResetIn):
    user = db.find(db.users, "email", body.email)
    if not user:
        raise HTTPException(404, "no such account")
    # VULN[broken-reset] the token is never actually verified
    if body.new_password:
        user["password"] = body.new_password
    return {"ok": True}


@router.put("/auth/change-password")
def change_password(new_password: str = Body(..., embed=True), user=Depends(current_user)):
    user["password"] = new_password
    return {"ok": True}
