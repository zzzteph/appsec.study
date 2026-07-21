### latty-6

**Latty-6 (Bytebites API)** — an **OpenAPI / Swagger** food-delivery REST API (just-eat-inspired: users,
addresses, restaurants, menus, baskets, promos, orders, refunds). API-only; browse it at **`/docs`**
(Swagger UI) / **`/openapi.json`**. Focus: **API security** — broken auth, BOLA, server-side, business logic.

```
docker build -t latty-6 ./vms/latty-6
docker run --rm -p 8080:80 latty-6      # http://localhost:8080/docs
```

#### Auth — `jwtauthtest`
Every endpoint requires a **Bearer JWT except `POST /auth/token`**. That one endpoint mints a **valid JWT
for whatever `userId` you supply** — a "test auth" left in production, so you can authenticate as *anyone*
(broken authentication). Get a token, click **Authorize** in Swagger, then call the rest.

#### Planted vulnerabilities
- **BOLA / IDOR** (`VULN[bola]`) — by-id objects skip the ownership check, so any token reads other users'
  data: `GET /users/{id}`, `GET /users/{id}/addresses`, `GET /addresses/{id}`, `GET /baskets/{id}`,
  `GET /orders/{id}` (leaks email/phone/card, delivery addresses, order details).
- **Server-side** (`VULN[ssrf]`, `VULN[rce]`):
  - `POST /restaurants/{id}/logo {url}` — **SSRF**: server fetches an arbitrary URL (no allowlist) → reach
    the internal-only service `http://127.0.0.1:9000/secret`.
  - `POST /orders/{id}/receipt {template}` — **SSTI → RCE**: the receipt template is evaluated server-side
    with the order in scope (`{{ process.mainModule.require('child_process').execSync('id') }}`).
- **Business logic** (`VULN[business-logic]`):
  - `POST /baskets/{id}/promo` — the **same promo code stacks** (apply `SAVE5` repeatedly) → order total
    goes to zero / negative.
  - `POST /baskets/{id}/items` — **negative `quantity`** accepted → negative line totals.
  - `POST /orders/{id}/refund` — refunds are **not idempotent and not blocked after delivery** → request
    repeated credits.

Deliberately insecure by design — run only locally / on an isolated network.
