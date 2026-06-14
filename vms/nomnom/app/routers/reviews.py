from fastapi import APIRouter, HTTPException, Depends, Body
from ..auth import current_user
from .. import db
from ..models import ReviewIn

router = APIRouter(tags=["Reviews"])


@router.get("/reviews")
def list_reviews():
    return db.reviews


@router.post("/reviews")
def add_review(body: ReviewIn, user=Depends(current_user)):
    rid = next(db._review_seq)
    r = {"id": rid, "restaurant_id": body.restaurant_id, "user_id": user["id"],
         "rating": body.rating, "text": body.text, "reply": None}
    db.reviews.append(r)
    return r


@router.get("/reviews/{rid}")
def get_review(rid: int):
    r = db.find(db.reviews, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    return r


@router.put("/reviews/{rid}")
def update_review(rid: int, body: ReviewIn, user=Depends(current_user)):
    r = db.find(db.reviews, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r.update({"rating": body.rating, "text": body.text})  # VULN[bola] edit anyone's review
    return r


@router.patch("/reviews/{rid}")
def patch_review(rid: int, body: dict = Body(...), user=Depends(current_user)):
    r = db.find(db.reviews, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r.update(body)
    return r


@router.delete("/reviews/{rid}")
def delete_review(rid: int, user=Depends(current_user)):
    r = db.find(db.reviews, "id", rid)
    if r:
        db.reviews.remove(r)
    return {"deleted": rid}


@router.post("/reviews/{rid}/reply")
def reply_review(rid: int, text: str, user=Depends(current_user)):
    r = db.find(db.reviews, "id", rid)
    if not r:
        raise HTTPException(404, "not found")
    r["reply"] = text
    return r


@router.post("/reviews/{rid}/report")
def report_review(rid: int, user=Depends(current_user)):
    return {"reported": rid}
