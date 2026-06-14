from fastapi import APIRouter, HTTPException, Depends
from ..auth import current_user
from .. import db
from ..models import BasketItemIn, CheckoutIn

router = APIRouter(tags=["Baskets"])


@router.post("/baskets")
def create_basket(user=Depends(current_user)):
    bid = next(db._basket_seq)
    b = {"id": bid, "user_id": user["id"], "items": [], "promo": None}
    db.baskets[bid] = b
    return b


@router.get("/baskets/{bid}")
def get_basket(bid: int, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if not b:
        raise HTTPException(404, "not found")
    return b  # VULN[bola-basket] no ownership check


@router.delete("/baskets/{bid}")
def delete_basket(bid: int, user=Depends(current_user)):
    db.baskets.pop(bid, None)
    return {"deleted": bid}


@router.post("/baskets/{bid}/items")
def add_basket_item(bid: int, body: BasketItemIn, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if not b:
        raise HTTPException(404, "not found")
    b["items"].append(body.model_dump())
    return b


@router.patch("/baskets/{bid}/items/{iid}")
def update_basket_item(bid: int, iid: int, qty: int, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if not b or iid >= len(b["items"]):
        raise HTTPException(404, "not found")
    b["items"][iid]["qty"] = qty  # VULN[bl-negative] qty not validated (negative allowed)
    return b


@router.delete("/baskets/{bid}/items/{iid}")
def delete_basket_item(bid: int, iid: int, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if b and iid < len(b["items"]):
        b["items"].pop(iid)
    return b


@router.post("/baskets/{bid}/apply-promo")
def apply_promo(bid: int, code: str, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if not b:
        raise HTTPException(404, "not found")
    p = db.find(db.promos, "code", code)
    if not p or not p["active"]:
        raise HTTPException(404, "invalid promo")
    b["promo"] = code  # VULN[coupon-reuse] no per-user / per-order redemption limit
    return {"applied": code, "percent": p["percent"]}


@router.post("/baskets/{bid}/checkout")
def checkout(bid: int, body: CheckoutIn, user=Depends(current_user)):
    b = db.baskets.get(bid)
    if not b:
        raise HTTPException(404, "not found")
    total = 0.0
    for it in b["items"]:
        mi = db.find(db.menu_items, "id", it["item_id"])
        if mi:
            total += mi["price"] * it["qty"]
    if b.get("promo"):
        p = db.find(db.promos, "code", b["promo"])
        if p:
            total *= 1 - p["percent"] / 100
    # VULN[price-tamper] a client-supplied total overrides the computed price
    final = body.total if body.total is not None else round(total, 2)
    rid = (db.find(db.menu_items, "id", b["items"][0]["item_id"]) or {}).get("restaurant_id") if b["items"] else None
    oid = next(db._order_seq)
    o = {"id": oid, "user_id": user["id"], "restaurant_id": rid, "items": b["items"],
         "total": final, "status": "pending", "address": body.address}
    db.orders.append(o)
    db.baskets.pop(bid, None)
    return o
