### shoppy

**Shoppy** — the same shop as [graph](../graph/), but the API is a **full REST API** (Express)
instead of GraphQL, with **JWT access + refresh** auth. Deliberately vulnerable. Single container:
the Node server serves the built Vue SPA and the REST API under `/api`.

```
docker build -t shoppy ./vms/shoppy
docker run --rm -p 8080:80 shoppy      # app: http://localhost:8080  ·  API: /api/*
```

Seed accounts: `admin/adminpass`, `alice/alice` (+ ~60 UUID users, 6 shops, 100+ items, 40 orders,
gift cards, coupons, FAQ). Bearer **access** token; unauthed users can build a cart (via the
`x-cart-id` header) but **checkout requires auth**. Errors return a stack trace (`VULN[verbose-errors]`).

#### Planted vulnerabilities (answer key; each tagged `VULN[id]` in `server/routes.js`)

| Class | REST endpoint(s) |
|---|---|
| **BOLA / IDOR** | `GET /api/users/:id`, `/users/:id/orders`, `/users/:id/favorites`, `GET /api/orders/:id`, `/orders/:id/notes`, `GET /api/giftcards/:code` |
| **invite-IDOR** (+ inviter UUID) | `GET /api/users/:id/invitations` |
| **hidden admin** (UUID dump, referenced only in the SPA JS) | `GET /api/recent-users` |
| **excessive data** (`passwordHash` + `accessToken`) | `GET /api/me`, `/users`, `/users/:id` |
| **SQL injection** (SQLite) | `GET /api/search/items?q=`, `/api/search/reviews?q=` |
| **path traversal** | `GET /api/orders/:id/invoice?file=`, `GET /api/help?path=` |
| **mass-assignment** | `POST /api/register` (`role`,`credits`), `PATCH /api/users/:id` |
| **BOLA profile / email-change ATO** | `PATCH /api/users/:id`, `POST /api/users/:id/email` |
| **impersonation** | `POST /api/login-as` (no admin check) |
| **weak JWT / non-rotating refresh** | tokens (`shoppy-secret` / `shoppy-refresh` — same weak-secret pattern) |
| **weak / leaked reset** | `POST /api/password/forgot`, `/password/reset` |
| **price-tamper / coupon-stacking / option-price** | `POST /api/checkout`, `POST /api/cart/items` |
| **refund-abuse / cancel** | `POST /api/orders/:id/refund`, `/orders/:id/cancel` |
| **credits theft** | `POST /api/credits/transfer` (negative amount) |
| **gift-card enum** | sequential `GC-00000N`, `GET /api/giftcards/:code` |
| **BFLA / privesc** | `POST /api/seller`, `POST /api/items`, `PATCH /api/items/:id` (negative price), `PATCH /api/shops/:id` |
| **SSRF** | `POST /api/webhooks` (server fetches the URL) |
| **file upload** (traversal + stored XSS) | `POST /api/upload` → served from `/uploads/*` |
| **stored XSS** | `POST /api/shops/:id/reviews`, `PUT /api/articles/:slug` (unauth CMS), order notes |
| **enumeration** | `login`, `register`, `PATCH /users/:id`, `invite`, gift-card redeem |

Same vuln surface as graph — this is the REST twin, for comparing GraphQL vs REST attack surface.

Deliberately insecure by design — run only locally / on an isolated network.
