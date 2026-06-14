from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import PaymentIn, PaymentMethodIn

router = APIRouter(tags=["Payments"])


@router.get("/payments")
def list_payments(user=Depends(current_user)):
    # VULN[bola] + VULN[excessive-data] every payment incl. stored card number
    return db.payments


@router.post("/payments")
def create_payment(body: PaymentIn, user=Depends(current_user)):
    o = db.find(db.orders, "id", body.order_id)
    if not o:
        raise HTTPException(404, "order not found")
    # VULN[price-tamper] the charged amount comes from the request, not the order
    pid = next(db._payment_seq)
    p = {"id": pid, "order_id": body.order_id, "amount": body.amount, "method": body.method,
         "status": "captured", "card": "****"}
    db.payments.append(p)
    o["status"] = "paid"
    return p


@router.get("/payments/{pid}")
def get_payment(pid: int, user=Depends(current_user)):
    p = db.find(db.payments, "id", pid)
    if not p:
        raise HTTPException(404, "not found")
    return p  # VULN[bola]


@router.post("/payments/{pid}/capture")
def capture_payment(pid: int, user=Depends(current_user)):
    p = db.find(db.payments, "id", pid)
    if not p:
        raise HTTPException(404, "not found")
    p["status"] = "captured"
    return p


@router.post("/payments/{pid}/refund")
def refund_payment(pid: int, amount: Optional[float] = None, user=Depends(current_user)):
    p = db.find(db.payments, "id", pid)
    if not p:
        raise HTTPException(404, "not found")
    # VULN[bfla] anyone can refund; VULN[bl-refund] amount unbounded -> wallet credit
    amt = amount if amount is not None else p["amount"]
    user["wallet"] += amt
    p["status"] = "refunded"
    return {"refunded": amt, "wallet": user["wallet"]}


@router.get("/payment-methods")
def my_payment_methods(user=Depends(current_user)):
    return user.get("payment_methods", [])


@router.post("/payment-methods")
def add_my_payment_method(body: PaymentMethodIn, user=Depends(current_user)):
    pm = body.model_dump()
    pm["id"] = len(user["payment_methods"]) + 1
    user["payment_methods"].append(pm)
    return pm


@router.delete("/payment-methods/{pid}")
def delete_my_payment_method(pid: int, user=Depends(current_user)):
    pm = db.find(user.get("payment_methods", []), "id", pid)
    if pm:
        user["payment_methods"].remove(pm)
    return {"deleted": pid}


@router.post("/webhooks/stripe")
def stripe_webhook(body: dict = Body(...)):
    # VULN[webhook-no-verify] no signature check — anyone can mark a payment paid
    pid = body.get("payment_id")
    p = db.find(db.payments, "id", pid) if pid else None
    if p:
        p["status"] = body.get("status", "captured")
    return {"ok": True}
