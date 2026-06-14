from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import RestaurantIn

router = APIRouter(tags=["Restaurants"])


@router.get("/restaurants")
def list_restaurants():
    return db.restaurants


@router.get("/restaurants/search")
def search_restaurants(q: str = ""):
    ql = q.lower()
    return [r for r in db.restaurants if ql in r["name"].lower() or ql in r["cuisine"].lower()]


@router.get("/restaurants/nearby")
def nearby_restaurants(lat: float = 51.5, lng: float = -0.12):
    return db.restaurants


@router.post("/restaurants")
def create_restaurant(body: RestaurantIn, user=Depends(current_user)):
    rid = next(db._restaurant_seq)
    r = {"id": rid, "name": body.name, "cuisine": body.cuisine, "address": body.address,
         "rating": 0.0, "owner_id": user["id"], "is_open": True, "hours": body.hours}
    db.restaurants.append(r)
    return r


@router.get("/restaurants/{rid}")
def get_restaurant(rid: int):
    r = db.find(db.restaurants, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    return r


@router.put("/restaurants/{rid}")
def update_restaurant(rid: int, body: RestaurantIn, user=Depends(current_user)):
    r = db.find(db.restaurants, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r.update(body.model_dump(exclude_unset=True))  # VULN[bola-restaurant] no owner check
    return r


@router.patch("/restaurants/{rid}")
def patch_restaurant(rid: int, body: dict = Body(...), user=Depends(current_user)):
    r = db.find(db.restaurants, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r.update(body)  # VULN[mass-assignment] + VULN[bola]
    return r


@router.delete("/restaurants/{rid}")
def delete_restaurant(rid: int, user=Depends(current_user)):
    r = db.find(db.restaurants, "id", rid)
    if r:
        db.restaurants.remove(r)
    return {"deleted": rid}


@router.get("/restaurants/{rid}/hours")
def get_hours(rid: int):
    return {"hours": (db.find(db.restaurants, "id", rid) or {}).get("hours")}


@router.put("/restaurants/{rid}/hours")
def set_hours(rid: int, hours: str, user=Depends(current_user)):
    r = db.find(db.restaurants, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r["hours"] = hours
    return r


@router.patch("/restaurants/{rid}/status")
def set_status(rid: int, is_open: bool, user=Depends(current_user)):
    r = db.find(db.restaurants, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r["is_open"] = is_open
    return r


@router.get("/restaurants/{rid}/reviews")
def restaurant_reviews(rid: int):
    return [rv for rv in db.reviews if rv["restaurant_id"] == rid]


@router.get("/restaurants/{rid}/stats")
def restaurant_stats(rid: int, user=Depends(current_user)):
    # VULN[bola] owner-only stats with no ownership check
    return {"orders": len([o for o in db.orders if o["restaurant_id"] == rid])}
