from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import OrderIn

router = APIRouter(tags=["Orders"])


@router.get("/orders")
def list_orders(user=Depends(current_user)):
    return db.orders  # VULN[bola] returns ALL orders, not just the caller's


@router.post("/orders")
def create_order(body: OrderIn, user=Depends(current_user)):
    total = body.total
    if total is None:
        total = 0.0
        for it in body.items:
            mi = db.find(db.menu_items, "id", it.item_id)
            if mi:
                total += mi["price"] * it.qty
    oid = next(db._order_seq)
    o = {"id": oid, "user_id": user["id"], "restaurant_id": body.restaurant_id,
         "items": [i.model_dump() for i in body.items], "total": round(total, 2),
         "status": "pending", "address": body.address}
    db.orders.append(o)
    return o


@router.get("/orders/{oid}")
def get_order(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    return o  # VULN[bola-orders]


@router.put("/orders/{oid}")
def replace_order(oid: int, body: dict = Body(...), user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    o.update(body)  # VULN[mass-assignment] + VULN[bola] (total/status writable)
    return o


@router.delete("/orders/{oid}")
def delete_order(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if o:
        db.orders.remove(o)
    return {"deleted": oid}


@router.patch("/orders/{oid}/status")
def set_order_status(oid: int, status: str, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    o["status"] = status  # VULN[bl-status] mark delivered/refunded without paying
    return o


@router.post("/orders/{oid}/cancel")
def cancel_order(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    o["status"] = "cancelled"
    return o


@router.get("/orders/{oid}/track")
def track_order(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    return {"order": oid, "status": o["status"], "driver": db.drivers[0] if db.drivers else None}


@router.post("/orders/{oid}/reorder")
def reorder(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    nid = next(db._order_seq)
    n = dict(o)
    n["id"] = nid
    n["status"] = "pending"
    n["user_id"] = user["id"]
    db.orders.append(n)
    return n


@router.get("/orders/{oid}/invoice")
def order_invoice(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    # VULN[idor-invoice] leaks the customer record (incl. PII) for any order
    return {"invoice_for": oid, "address": o["address"], "total": o["total"],
            "customer": db.users_by_id.get(o["user_id"])}


@router.get("/orders/{oid}/receipt")
def order_receipt(oid: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    return {"receipt": oid, "total": o["total"]}


@router.post("/orders/{oid}/rate")
def rate_order(oid: int, rating: int, user=Depends(current_user)):
    o = db.find(db.orders, "id", oid)
    if not o:
        raise HTTPException(404, "not found")
    return {"order": oid, "rating": rating}
