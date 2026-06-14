from fastapi import APIRouter, HTTPException, Depends
from ..auth import current_user
from .. import db
from ..models import UserCreate, UserUpdate, AddressIn, PaymentMethodIn

router = APIRouter(tags=["Users"])


@router.get("/users")
def list_users(user=Depends(current_user)):
    # VULN[excessive-data] full records incl. passwords; VULN[bfla] any user can list
    return db.users


@router.post("/users")
def create_user(body: UserCreate):
    uid = db.new_user_id()
    u = {"id": uid, "name": body.name, "email": body.email, "password": body.password,
         "role": body.role, "referral_code": uid.upper(), "wallet": 0.0,
         "addresses": [], "payment_methods": []}
    db.users.append(u)
    db.users_by_id[uid] = u
    return u


@router.get("/users/{uid}")
def get_user(uid: str, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    return u  # VULN[bola-users] no ownership check


@router.put("/users/{uid}")
def replace_user(uid: str, body: UserUpdate, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    u.update(body.model_dump(exclude_unset=True))  # VULN[mass-assignment] + VULN[bola]
    return u


@router.patch("/users/{uid}")
def patch_user(uid: str, body: UserUpdate, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    u.update(body.model_dump(exclude_unset=True))  # VULN[mass-assignment] + VULN[bola]
    return u


@router.delete("/users/{uid}")
def delete_user(uid: str, user=Depends(current_user)):
    u = db.users_by_id.pop(uid, None)
    if u and u in db.users:
        db.users.remove(u)
    return {"deleted": uid}  # VULN[bola] + VULN[bfla]


@router.get("/users/{uid}/orders")
def user_orders(uid: str, user=Depends(current_user)):
    return [o for o in db.orders if o["user_id"] == uid]  # VULN[bola-orders]


@router.get("/users/{uid}/addresses")
def list_addresses(uid: str, user=Depends(current_user)):
    return (db.users_by_id.get(uid) or {}).get("addresses", [])


@router.post("/users/{uid}/addresses")
def add_address(uid: str, body: AddressIn, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    addr = body.model_dump()
    addr["id"] = len(u["addresses"]) + 1
    u["addresses"].append(addr)
    return addr


@router.get("/users/{uid}/addresses/{aid}")
def get_address(uid: str, aid: int, user=Depends(current_user)):
    a = db.find((db.users_by_id.get(uid) or {}).get("addresses", []), "id", aid)
    if not a:
        raise HTTPException(404, "not found")
    return a


@router.put("/users/{uid}/addresses/{aid}")
def update_address(uid: str, aid: int, body: AddressIn, user=Depends(current_user)):
    a = db.find((db.users_by_id.get(uid) or {}).get("addresses", []), "id", aid)
    if not a:
        raise HTTPException(404, "not found")
    a.update(body.model_dump())
    return a


@router.delete("/users/{uid}/addresses/{aid}")
def delete_address(uid: str, aid: int, user=Depends(current_user)):
    u = db.users_by_id.get(uid) or {}
    a = db.find(u.get("addresses", []), "id", aid)
    if a:
        u["addresses"].remove(a)
    return {"deleted": aid}


@router.get("/users/{uid}/payment-methods")
def list_payment_methods(uid: str, user=Depends(current_user)):
    # VULN[excessive-data] + VULN[bola] returns full card numbers for any user
    return (db.users_by_id.get(uid) or {}).get("payment_methods", [])


@router.post("/users/{uid}/payment-methods")
def add_payment_method(uid: str, body: PaymentMethodIn, user=Depends(current_user)):
    u = db.users_by_id.get(uid)
    if not u:
        raise HTTPException(404, "not found")
    pm = body.model_dump()
    pm["id"] = len(u["payment_methods"]) + 1
    u["payment_methods"].append(pm)
    return pm


@router.delete("/users/{uid}/payment-methods/{pid}")
def delete_payment_method(uid: str, pid: int, user=Depends(current_user)):
    u = db.users_by_id.get(uid) or {}
    pm = db.find(u.get("payment_methods", []), "id", pid)
    if pm:
        u["payment_methods"].remove(pm)
    return {"deleted": pid}


@router.get("/users/{uid}/wallet")
def get_wallet(uid: str, user=Depends(current_user)):
    return {"wallet": (db.users_by_id.get(uid) or {}).get("wallet", 0.0)}
