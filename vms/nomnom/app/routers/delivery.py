from fastapi import APIRouter, HTTPException, Depends
from ..auth import current_user
from .. import db
from ..models import DriverIn

router = APIRouter(tags=["Delivery"])


@router.get("/drivers")
def list_drivers(user=Depends(current_user)):
    return db.drivers  # VULN[excessive-data] driver PII (name, phone, live location)


@router.post("/drivers")
def add_driver(body: DriverIn, user=Depends(current_user)):
    did = next(db._driver_seq)
    d = {"id": did, "name": body.name, "phone": body.phone, "lat": 0.0, "lng": 0.0, "status": "available"}
    db.drivers.append(d)
    return d


@router.get("/drivers/{did}")
def get_driver(did: int, user=Depends(current_user)):
    d = db.find(db.drivers, "id", did)
    if not d:
        raise HTTPException(404, "not found")
    return d


@router.put("/drivers/{did}")
def update_driver(did: int, body: DriverIn, user=Depends(current_user)):
    d = db.find(db.drivers, "id", did)
    if not d:
        raise HTTPException(404, "not found")
    d.update(body.model_dump())
    return d


@router.patch("/drivers/{did}/location")
def update_driver_location(did: int, lat: float, lng: float, user=Depends(current_user)):
    d = db.find(db.drivers, "id", did)
    if not d:
        raise HTTPException(404, "not found")
    d["lat"], d["lng"] = lat, lng
    return d


@router.delete("/drivers/{did}")
def delete_driver(did: int, user=Depends(current_user)):
    d = db.find(db.drivers, "id", did)
    if d:
        db.drivers.remove(d)
    return {"deleted": did}


@router.post("/deliveries")
def create_delivery(order_id: int, user=Depends(current_user)):
    did = next(db._delivery_seq)
    de = {"id": did, "order_id": order_id, "driver_id": None, "status": "pending"}
    db.deliveries.append(de)
    return de


@router.get("/deliveries/{did}")
def get_delivery(did: int, user=Depends(current_user)):
    de = db.find(db.deliveries, "id", did)
    if not de:
        raise HTTPException(404, "not found")
    return de


@router.patch("/deliveries/{did}/assign")
def assign_delivery(did: int, driver_id: int, user=Depends(current_user)):
    de = db.find(db.deliveries, "id", did)
    if not de:
        raise HTTPException(404, "not found")
    de["driver_id"] = driver_id
    return de


@router.patch("/deliveries/{did}/status")
def set_delivery_status(did: int, status: str, user=Depends(current_user)):
    de = db.find(db.deliveries, "id", did)
    if not de:
        raise HTTPException(404, "not found")
    de["status"] = status
    return de
