import time
from fastapi import APIRouter, HTTPException, Depends
from ..auth import current_user
from .. import db
from ..models import PromoIn

router = APIRouter(tags=["Referrals & Promos"])


@router.post("/referrals")
def create_referral(user=Depends(current_user)):
    code = user["referral_code"]
    if not db.find(db.referrals, "code", code):
        db.referrals.append({"code": code, "owner_id": user["id"], "redeemed_by": []})
    return {"code": code}


@router.get("/referrals")
def list_referrals(user=Depends(current_user)):
    return db.referrals


@router.get("/referrals/{code}")
def get_referral(code: str):
    ref = db.find(db.referrals, "code", code)
    if not ref:
        raise HTTPException(404, "not found")
    return ref


@router.post("/referrals/{code}/redeem")
def redeem_referral(code: str, user=Depends(current_user)):
    ref = db.find(db.referrals, "code", code)
    if not ref:
        raise HTTPException(404, "no such code")
    # VULN[referral-self-redeem] no check that the redeemer isn't the code owner.
    # VULN[referral-race] classic check-then-act on shared state with no lock.
    # FastAPI runs sync endpoints in a threadpool, so several concurrent redeems
    # can all pass the guard below before any of them records the redemption —
    # the 5.00 credit is then granted multiple times for a single code. The small
    # sleep widens the TOCTOU window so the race is reliably winnable.
    if user["id"] in ref["redeemed_by"]:
        raise HTTPException(409, "already redeemed")
    time.sleep(0.05)
    ref["redeemed_by"].append(user["id"])
    user["wallet"] += 5.0
    return {"credited": 5.0, "wallet": user["wallet"]}


@router.get("/promos")
def list_promos():
    return db.promos


@router.post("/promos")
def add_promo(body: PromoIn, user=Depends(current_user)):
    db.promos.append({"code": body.code, "percent": body.percent, "active": True})
    return db.promos[-1]


@router.put("/promos/{code}")
def update_promo(code: str, body: PromoIn, user=Depends(current_user)):
    p = db.find(db.promos, "code", code)
    if not p:
        raise HTTPException(404, "not found")
    p["percent"] = body.percent
    return p


@router.delete("/promos/{code}")
def delete_promo(code: str, user=Depends(current_user)):
    p = db.find(db.promos, "code", code)
    if p:
        db.promos.remove(p)
    return {"deleted": code}
