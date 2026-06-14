### nomnom

**NomNom** — a deliberately-vulnerable food-ordering platform API (users, restaurants, menus,
baskets, orders, payments, delivery, reviews, referrals). ~117 operations across GET/POST/PUT/
PATCH/DELETE, with a **self-hosted Swagger UI** (no CDN — works fully offline).

```
docker build -t nomnom ./vms/nomnom
docker run --rm -p 8080:80 nomnom      # http://localhost:8080  ->  /docs
```

The whole API is a single FastAPI app with an in-memory store, so there is **no SQL** — the
planted bugs are API-layer flaws (broken authz, business logic, data exposure), which is where
most real food-delivery API bugs live.

#### Authentication

Auth is intentionally trivial: the bearer **token is just a user id** (unsigned). Authenticate
as anyone with `Authorization: Bearer <id>` — `u1` (customer Alice), `u2` (owner Bob), `u3`
(**admin** Carol). In Swagger, click **Authorize** and enter the id. Some endpoints are public
(browse/search/health/login), most are authenticated (padlock in Swagger).

Need credentials fast? **`GET /api/auth-test`** is a leftover debug endpoint that returns valid
credentials + a ready token for any account (default: admin).

#### Findings

Every sink is annotated `# VULN[id]` in the source (`app/routers/*.py`, `app/auth.py`).

| `VULN[id]` | Endpoint(s) | Class | How to exploit |
|---|---|---|---|
| `forgeable-token` | all authenticated routes | Broken auth | Token is the user id, unsigned — send `Bearer u3` to act as admin |
| `debug-auth-test` | `GET /api/auth-test` | Debug leftover | Returns admin token + password with no auth (`?user=` for any account) |
| `bola-users` | `GET /users/{id}` | BOLA / IDOR | Read any user (incl. password) as any token |
| `mass-assignment` | `PUT/PATCH /users/{id}`, `PUT /orders/{id}`, `PATCH /restaurants/{id}` | Mass assignment | Send `{"role":"admin"}` / `{"wallet":9999}` / `{"total":0}` |
| `bola-orders` | `GET /orders`, `GET /orders/{id}`, `GET /users/{id}/orders` | BOLA | `GET /orders` returns **every** order; fetch any order by id |
| `idor-invoice` | `GET /orders/{id}/invoice` | BOLA | Leaks the customer record (PII) for any order |
| `price-tamper` | `POST /baskets/{id}/checkout`, `POST /payments`, `POST /orders` | Business logic | Supply your own `total`/`amount` (e.g. `0.01`) |
| `bl-status` | `PATCH /orders/{id}/status` | Business logic | Mark an order `delivered`/`refunded` without paying |
| `bl-refund` + `bfla` | `POST /payments/{id}/refund` | Business logic / BFLA | Unbounded refund → wallet credit, no ownership/role check |
| `bl-negative` | `PATCH /baskets/{id}/items/{i}` | Business logic | Negative quantity → negative line total |
| `coupon-reuse` | `POST /baskets/{id}/apply-promo` | Business logic | No per-user/order redemption limit |
| `referral-race` | `POST /referrals/{code}/redeem` | **Race condition (TOCTOU)** | Fire concurrent redeems → the 5.00 credit is granted multiple times (verified: 4× / balance 20) |
| `referral-self-redeem` | `POST /referrals/{code}/redeem` | Business logic | Redeem your own referral code |
| `webhook-no-verify` | `POST /webhooks/stripe` | Broken auth | No signature check — mark any payment `captured` |
| `bfla` | `GET /admin/*`, `POST /admin/users/{id}/promote` | Missing function-level authz | Any token hits admin routes; promote yourself to admin |
| `excessive-data` | `GET /auth/me`, `/users`, `/users/{id}/payment-methods`, `/payments`, `/drivers`, `/admin/export` | Excessive data exposure | Returns passwords, full card numbers, driver PII/location |
| `secrets` | `GET /admin/config` | Secrets exposure | Leaks Stripe + JWT-style secret keys |
| `secrets-plaintext` | (storage) | Crypto | Passwords stored in clear |
| `user-enum` | `POST /auth/register`, `/auth/login` | Auth | Distinct messages reveal which emails exist |
| `no-rate-limit` | `POST /auth/login` | Auth | No throttling → credential stuffing |
| `reset-token-weak` / `broken-reset` / `info-disclosure` | `POST /auth/forgot-password`, `/auth/reset-password` | Auth | Predictable reset token, returned in the response, never verified |
| `verbose-error` | `GET /version?debug=true` | Info disclosure | Dumps a stack trace + internal state |
| `sqli` | `GET /dishes/search?q=` | SQL injection | SQLite-backed search, `q` concatenated → `' OR '1'='1` dumps all, `'` → error |
| `ssrf` | `GET /tools/fetch?url=` | SSRF | `file:///etc/passwd`, `http://169.254.169.254/…`, internal hosts |
| `open-redirect` | `GET /go?next=` | Open redirect | `?next=https://evil.example` → 307 |
| `xxe` | `POST /orders/import` (XML body) | XXE | `<!DOCTYPE r [<!ENTITY x SYSTEM "file:///etc/passwd">]>` → file read |
| `ssti` | `GET /notify/preview?template=` | SSTI | Jinja2 render → `{{7*7}}` = 49, sandbox escape → RCE |
| `file-upload` | `POST /account/avatar` → `GET /uploads/{name}` | Unrestricted upload | Upload `x.html` with `<script>` → served as `text/html` (stored XSS) |
| `jwt-alg-none` / `jwt-weak-secret` | `POST /auth/jwt-login`, `GET /account/premium` | JWT | Signature not verified (`alg:none`) → forge `role:admin`; weak HS256 secret `secret` |
| `cors` | all responses | CORS misconfig | Reflects any `Origin` + `Access-Control-Allow-Credentials: true` |
| `graphql-idor` / `graphql-secret` / `graphql-introspection` | `POST /graphql` (GraphiQL UI) | GraphQL | `{ user(id:"u3"){ password } secret }` — unauth IDOR + secret field + introspection |

Example — the race condition:

```
for i in $(seq 1 20); do
  curl -s -X POST -H "Authorization: Bearer u2" \
    http://localhost:8080/referrals/ALICE10/redeem & done; wait
curl -s -H "Authorization: Bearer u2" http://localhost:8080/users/u2/wallet   # > 5.0
```

Deliberately insecure by design — run only locally / on an isolated network.
