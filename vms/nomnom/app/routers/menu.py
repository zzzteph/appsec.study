from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import MenuItemIn, CategoryIn, ModifierIn

router = APIRouter(tags=["Menu"])


@router.get("/restaurants/{rid}/menu")
def get_menu(rid: int):
    return [m for m in db.menu_items if m["restaurant_id"] == rid]


@router.post("/restaurants/{rid}/menu")
def add_menu_item(rid: int, body: MenuItemIn, user=Depends(current_user)):
    mid = next(db._menu_seq)
    m = {"id": mid, "restaurant_id": rid, "name": body.name, "price": body.price, "category": body.category}
    db.menu_items.append(m)  # VULN[bola] no check the caller owns the restaurant
    return m


@router.get("/menu-items/{mid}")
def get_item(mid: int):
    m = db.find(db.menu_items, "id", mid)
    if not m:
        raise HTTPException(404, "not found")
    return m


@router.put("/menu-items/{mid}")
def update_item(mid: int, body: MenuItemIn, user=Depends(current_user)):
    m = db.find(db.menu_items, "id", mid)
    if not m:
        raise HTTPException(404, "not found")
    m.update(body.model_dump())
    return m


@router.patch("/menu-items/{mid}")
def patch_item(mid: int, body: dict = Body(...), user=Depends(current_user)):
    m = db.find(db.menu_items, "id", mid)
    if not m:
        raise HTTPException(404, "not found")
    m.update(body)
    return m


@router.delete("/menu-items/{mid}")
def delete_item(mid: int, user=Depends(current_user)):
    m = db.find(db.menu_items, "id", mid)
    if m:
        db.menu_items.remove(m)
    return {"deleted": mid}


@router.get("/categories")
def list_categories():
    return db.categories


@router.post("/categories")
def add_category(body: CategoryIn, user=Depends(current_user)):
    cid = next(db._category_seq)
    c = {"id": cid, "name": body.name}
    db.categories.append(c)
    return c


@router.put("/categories/{cid}")
def update_category(cid: int, body: CategoryIn, user=Depends(current_user)):
    c = db.find(db.categories, "id", cid)
    if not c:
        raise HTTPException(404, "not found")
    c["name"] = body.name
    return c


@router.delete("/categories/{cid}")
def delete_category(cid: int, user=Depends(current_user)):
    c = db.find(db.categories, "id", cid)
    if c:
        db.categories.remove(c)
    return {"deleted": cid}


@router.get("/modifiers")
def list_modifiers():
    return db.modifiers


@router.post("/modifiers")
def add_modifier(body: ModifierIn, user=Depends(current_user)):
    mid = next(db._modifier_seq)
    m = {"id": mid, "name": body.name, "price": body.price}
    db.modifiers.append(m)
    return m


@router.patch("/modifiers/{mid}")
def patch_modifier(mid: int, body: dict = Body(...), user=Depends(current_user)):
    m = db.find(db.modifiers, "id", mid)
    if not m:
        raise HTTPException(404, "not found")
    m.update(body)
    return m


@router.delete("/modifiers/{mid}")
def delete_modifier(mid: int, user=Depends(current_user)):
    m = db.find(db.modifiers, "id", mid)
    if m:
        db.modifiers.remove(m)
    return {"deleted": mid}
