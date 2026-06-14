import os
import urllib.request

import jwt as pyjwt
from jinja2 import Template
from lxml import etree
from fastapi import APIRouter, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.responses import RedirectResponse

from ..auth import current_user
from .. import db
from ..models import LoginIn

router = APIRouter(tags=["Integrations & Extras"])

# VULN[jwt-weak-secret] — HS256 signing secret is trivially guessable.
JWT_WEAK_SECRET = "secret"

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/dishes/search")
def search_dishes(q: str = ""):
    # VULN[sqli] q concatenated into SQL; VULN[error-disclosure] raw error + query returned.
    sql = "SELECT id, name, price, category, restaurant_id FROM dishes WHERE name LIKE '%" + q + "%'"
    try:
        return {"query": sql, "results": [dict(r) for r in db.sql_conn.execute(sql).fetchall()]}
    except Exception as e:
        return {"error": str(e), "query": sql}


@router.get("/tools/fetch")
def fetch_url(url: str):
    # VULN[ssrf] server fetches an arbitrary user URL (file://, 169.254.169.254, internal hosts).
    try:
        with urllib.request.urlopen(url, timeout=5) as r:
            return {"status": getattr(r, "status", 200), "body": r.read(4096).decode("utf-8", "replace")}
    except Exception as e:
        raise HTTPException(400, f"fetch failed: {e}")


@router.get("/go")
def go(next: str):
    # VULN[open-redirect] redirect target fully controlled by ?next=
    return RedirectResponse(next)


@router.post("/orders/import")
async def import_orders(request: Request):
    # VULN[xxe] external entities resolved -> local file disclosure / SSRF via a crafted DOCTYPE.
    data = await request.body()
    parser = etree.XMLParser(resolve_entities=True, no_network=False, load_dtd=True)
    try:
        root = etree.fromstring(data, parser)
        return {"parsed": etree.tostring(root, encoding="unicode")}
    except Exception as e:
        raise HTTPException(400, f"xml error: {e}")


@router.post("/account/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(current_user)):
    # VULN[file-upload] no type/extension check; the file is served back from /uploads with a
    # content-type matching its extension, so an uploaded .html/.svg yields stored XSS.
    name = os.path.basename(file.filename or "upload.bin")
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(await file.read())
    return {"url": f"/uploads/{name}"}


@router.get("/notify/preview")
def notify_preview(template: str = "Hi {{ name }}", name: str = "Alice", user=Depends(current_user)):
    # VULN[ssti] user-controlled template rendered by Jinja2 -> {{7*7}} and sandbox escape -> RCE.
    return {"rendered": Template(template).render(name=name, user=user)}


@router.post("/auth/jwt-login")
def jwt_login(body: LoginIn):
    u = db.find(db.users, "email", body.email)
    if not u or u["password"] != body.password:
        raise HTTPException(401, "invalid credentials")
    token = pyjwt.encode({"sub": u["id"], "role": u["role"]}, JWT_WEAK_SECRET, algorithm="HS256")
    return {"jwt": token, "note": "HS256 with a weak secret"}


@router.get("/account/premium")
def premium(authorization: str = Header(...)):
    token = authorization.split(" ")[-1]
    # VULN[jwt-alg-none] the signature is NOT verified, so a forged/`alg:none` token with
    # role=admin is accepted as-is.
    claims = pyjwt.decode(token, options={"verify_signature": False})
    return {"sub": claims.get("sub"), "role": claims.get("role"),
            "premium": claims.get("role") == "admin"}
