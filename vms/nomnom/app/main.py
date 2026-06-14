import os
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from .routers import (
    auth, users, restaurants, menu, baskets, orders,
    payments, delivery, reviews, referrals, admin, extra,
)
from .graphql_app import graphql_router

DESCRIPTION = """
**NomNom** — a food-ordering platform API (users, restaurants, menus, baskets,
orders, payments, delivery, reviews, referrals) + integrations (SSRF, XXE, SSTI,
file upload, JWT, GraphQL at `/graphql`).

Deliberately insecure by design, for API security training. Auth is intentionally
trivial: the bearer **token is just a user id** (e.g. `Authorize` with `u1`).
Need credentials fast? Hit **`GET /api/auth-test`** (debug) for a ready admin token.

Run only on a local / isolated network.
"""

# Default docs are disabled so we can serve a self-hosted Swagger UI (assets
# vendored into the image) instead of the CDN-backed default that needs internet.
app = FastAPI(title="NomNom API", version="1.0.0", description=DESCRIPTION,
              docs_url=None, redoc_url=None)


@app.middleware("http")
async def cors_reflect(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin:
        # VULN[cors] reflects any Origin AND allows credentials -> cross-origin read.
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response


STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=STATIC_DIR), name="assets")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
# html=True so an uploaded .html is served as a page (stored-XSS payoff for file-upload).
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR, html=True), name="uploads")


@app.get("/docs", include_in_schema=False)
def swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="NomNom API — Swagger UI",
        swagger_js_url="/assets/swagger/swagger-ui-bundle.js",
        swagger_css_url="/assets/swagger/swagger-ui.css",
    )


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


for module in (auth, users, restaurants, menu, baskets, orders,
               payments, delivery, reviews, referrals, admin, extra):
    app.include_router(module.router)

app.include_router(graphql_router, prefix="/graphql")
