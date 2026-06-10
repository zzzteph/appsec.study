# Boxcutter Store — vulnerable test target

> A deliberately-vulnerable e-commerce web app for **general pentest practice and
> scanner testing** — a believable storefront on the surface, a broad spread of planted
> bugs underneath. Point any scanner at it, or test it by hand.

A realistic-looking storefront seeded with a broad spread of planted
vulnerabilities. Its purpose is to **measure what a scanner does and does not
discover** — not to teach. Every weakness is marked `# VULN[id]` in `app.py`
(or in the Vue source / static JS); the inventory below lists them all with a
rough difficulty for a scanner that does not execute JavaScript.

> Intentionally insecure. Run it locally / in an isolated network only.

## The business (cover story)

**Boxcutter Store** is a direct-to-consumer e-commerce company selling thoughtfully
designed everyday goods — apparel, bags, home and stationery — out of Portland, OR,
with carbon-neutral shipping since 2014. The product is a believable online shop so
that a crawler or agent treats it as a real, valuable target.

What the app does, by domain:

- **Storefront** — browse/search the catalogue, categories, weekly deals, a blog and
  a help centre, plus about/contact pages (server-rendered marketing + catalogue).
- **Customer accounts** — register / sign in, manage your profile (name, email, bio,
  avatar), view orders and settings (a built Vue SPA over the REST API).
- **Commerce** — redeem an invitation/voucher code, place an order, pay by card
  (sandbox accepts test cards like `4242…`), receive a **confirmation code**, and the
  order is fulfilled; orders can be tracked.
- **Help centre** — support articles managed through a **GraphQL headless CMS**
  (queries to read articles, mutations to edit/publish them).
- **Public/Partner API** — a **versioned** REST API (`v1`/`v2`/`v3`) plus GraphQL,
  documented with OpenAPI/Swagger, for the mobile app and integration partners; JWT
  auth, with a sandbox token endpoint for testing.
- **Ops/Platform** — Spring-style actuators, internal tooling, data exports, metrics.

Underneath that cover, every domain hides one or more planted weaknesses (see the
inventory below) — the storefront is the realistic shell; the bugs are the point.

## Interfaces

| Surface | Tech | Where |
|---|---|---|
| Public storefront | server-rendered (Flask + Bulma) | `/`, `/search`, `/product`, `/about`, `/deals`, ... |
| Customer account | **built Vue 3 SPA** (Vite) | `/dashboard` (a.k.a. `/app`) after sign-in |
| REST API | OpenAPI 3 + Swagger UI | `/api/...`, spec `/api/openapi.json`, docs `/api/docs` |
| GraphQL | single endpoint | `/graphql` |
| Ops endpoints | Spring-style actuators | `/actuator/*` |

## Run

```bash
docker build -t boxcutter-store ./test && docker run --rm -p 8000:8000 boxcutter-store
```

The Docker build compiles the Vue SPA (node stage) and serves it from Flask.
To run from source you need Node for the SPA build:

```bash
npm --prefix test/frontend install && npm --prefix test/frontend run build
pip install flask pyjwt && python test/app.py
```

Then point your scanner at `https://localhost:8000` (self-signed cert — pass `-k` or equivalent to skip verification).

To run without HTTPS: `docker run --rm -p 8000:8000 -e HTTPS=0 boxcutter-store`

**Accounts:** `user / user` (the demo customer), `alice / alice123`, `admin /
S3cur3Adm!n`. The JWT signing secret (`boxcutter-super-secret-key-2024`) is leaked
in `/static/js/config.js`, `/.env`, `/actuator/env`, `/config.bak` and `/debug`,
so an `admin` token can be forged.

## Vulnerability inventory

`E` find easily · `M` reachable with the right probe · `H` hard/blind (needs JS
execution, auth/JWT forging, or manual work — the **blind spots**).

### Injection
| id | Where | Type | |
|---|---|---|:-:|
| `sqli-error` | `/api/products?q='` | SQLi, error-based | E |
| `sqli-blind` | `/product?id=1 AND 1=1` | SQLi, boolean blind | M |
| `sqli-time` | `/product?id=1 AND sleep(5)` | SQLi, time blind | M |
| `api-sqli-jwt` | `/api/admin/search?q='` | SQLi behind JWT | M/H |
| `graphql-sqli` | `POST /graphql user(id:)` | SQLi via GraphQL arg | H |
| `cmd-injection` | `/api/tools/dns?host=x;id` | OS command injection | M |
| `nosql-injection` | `POST /api/v2/login` (`{"$ne":null}` / `'`) | NoSQL operator + error | H |
| `ssti` | `/greet?name={{7*7}}` | server-side template injection | M |
| `ssrf` | `/api/internal/fetch?url=` (hidden) | server-side request forgery | H |
| `open-redirect` | `/redirect?url=https://evil.example` | unvalidated redirect (302) | E |
| `xxe` | `POST /api/orders/import` (XML) | external entity → local file read / SSRF | H |
| `deserialization` | `/api/preferences` (`prefs` cookie) | pickle deserialization → RCE | H |
| `xpath-injection` | `/api/staff?name=` | XPath filter bypass (`'`, ` or `) | M |
| `ldap-injection` | `/api/directory?user=` | LDAP filter bypass (`*`, `)(`) | M |
| `ver-sqli` | `/api/v1/users/{id}` | legacy API version, no-auth SQLi | M |

### Cross-site scripting
| id | Where | Type | |
|---|---|---|:-:|
| `xss-reflected` | `/search?q=<script>` | reflected | E |
| `xss-stored` | `POST /review` → `/reviews?product_id=` | stored | H |
| `xss-stored-spa` | account → Settings → Bio (Vue `v-html`) | stored, client-rendered | H |
| `xss-dom` | `/welcome?name=`, `/dashboard#...` | DOM | H |
| `xss-attr` | `/profile-card?name=` | reflected, HTML-attribute context | M |
| `xss-js` | `/track-page?ref=` | reflected, JS-string context | M |
| `xss-href` | `/go?url=` | reflected, href/URI context (`javascript:`) | M |
| `xss-upload` | `POST /api/avatar` → `/uploads/<f>` | stored XSS via unrestricted file upload | M |
| `graphql-cms` | `updateHelpArticle` mutation → `/help` | stored XSS via unauth CMS edit | H |
| `dom-script-load` | `?widget=<url>` (in `app.js`) | external script loaded from URL/localStorage | H |
| `dom-localstorage` | `?pref=key:value` (in `app.js`) | arbitrary localStorage write | H |
| `swagger-dom-xss` | `/api/docs?url=` / `?configUrl=` | reflected into the Swagger-UI initialiser (JS-string) | M |
| `xss-postmessage` | account SPA — `window.postMessage({notice})` | DOM XSS via an unguarded `message` listener → Vue `v-html` | H |

### File path traversal
| id | Where | Type | |
|---|---|---|:-:|
| `path-traversal` | `/download?file=../../../../etc/passwd` | basic traversal | M |
| `path-traversal-filter` | `/api/files?name=....//....//etc/passwd` | filter bypass | H |

### Information disclosure
| id | Where | |
|---|---|:-:|
| `exposed-env` | `/.env` | E |
| `exposed-backup` | `/backup.sql`, `/config.bak` | E |
| exposed git | `/.git/config` (leaked CI token in remote URL), `/.git/HEAD` | E |
| `actuator-env` / `actuator-heapdump` | `/actuator/env`, `/actuator/heapdump`, `/actuator/health` | E |
| `actuator-configprops` | `/actuator/configprops/` (trailing-slash ACL bypass — `/configprops` → 401, `/configprops/` → 200 leaks prod creds) | M |
| `hidden-debug` | `/debug` | E |
| `exposed-phpinfo` | `/phpinfo`, `/phpinfo.php` | E |
| error disclosure | SQL errors (`/product`, `/api/products`), GraphQL traceback | E |

Exposures set realistic **Content-Type** headers so content-type-matching templates
(e.g. nuclei) fire: actuators return `application/vnd.spring-boot.actuator.v3+json`,
`/actuator/heapdump` returns `application/octet-stream`, `/.env` / `/.git/*` /
`/config.bak` / `/backup.sql` are `text/plain`, `/phpinfo` is `text/html`,
`/sitemap.xml` is `application/xml`.

### Access control
| id | Where | Type | |
|---|---|---|:-:|
| `hidden-admin` | `/admin`, `/api/v1/users` | unauthenticated admin | E |
| `api-idor` | `/api/users/{id}` | IDOR, no auth | M |
| `api-idor-jwt` | `/api/orders/{id}` (+ account → Orders) | IDOR behind JWT | M |
| `access-vertical` | `/api/admin/users` (forge `role=admin`) | privilege escalation | H |
| `access-header` | `/api/admin/stats` (`X-Admin: true`) | header-trust bypass | H |
| `mass-assignment` | `POST /api/account` (`role`) | mass assignment | H |
| `jwt-alg-none` | `/api/admin/console` | JWT signature not verified — forge `role=admin` (alg=none) | H |
| `ip-trust` | `/api/admin/metrics` (`X-Forwarded-For: 127.0.0.1`) | spoofable IP-trust bypass | H |
| `predictable-idor` | `/exports/users-2024-q1.json` | predictable, unauth data export | M |
| `param-access` | `/api/account/profile-by-id?user_id=` | horizontal access via parameter | H |
| `method-access` | `POST /api/orders/{id}/notes` | GET auth'd, POST not (method bypass) | H |
| `idor-invoice` | `GET /api/orders/{id}/invoice` | any order's invoice (JWT, no ownership) | M |
| `idor-orders` | `GET /api/users/{id}/orders` | any user's orders (no auth) | E |
| `idor-address` | `GET/PUT /api/account/addresses/{id}` | read/edit any address (JWT, no ownership) | M |
| `idor-profile-update` | `POST /api/profile/update` (`user_id`) | change any user's details (JWT, body id) | M |
| `ver-idor` | `GET /api/v2/users/{id}` | deprecated version IDOR (JWT, any id) | M |
| `bfla-refund` | `POST /api/admin/refund` | admin action, no role check | M |
| `bfla-delete` | `POST/GET /api/admin/delete-user` | admin action, no role check | M |
| `bfla-price` | `PUT /api/admin/products/{id}/price` | admin action, no role check | M |
| `bfla-coupon` | `POST /api/coupons/generate` | admin action, no role check | M |
| `tenant-isolation` | `GET /api/account/reports` (`X-Company-Id` / `company_id`) | cross-tenant (horizontal) data — org id is client-supplied, no membership check | H |
| `secondary-idor` | `POST /api/menu/items/update` (`where=../../v2/menu/{id}/items/{uuid}`) | secondary-context IDOR — `../` routes into the internal namespace → cross-tenant write | H |

### Secrets, hidden routes, API & GraphQL
| id | Where | |
|---|---|:-:|
| `js-secrets` | `/static/js/config.js` (AWS, Stripe, GitHub, JWT secret) | E |
| `hidden-api` | `/api/internal/debug`, `/api/v1/users` (in `app.js` + `/actuator/mappings`) | M |
| OpenAPI spec | `/api/openapi.json` | E |
| `jwt-test` | `/api/auth/token` (tagged `JWTTest`) | E |
| `graphql-introspection` | `POST /graphql { __schema }` | M |
| graphql issues | `POST /graphql` — `user(id:)`/`order(id:)` SQLi+IDOR, `setRole` unauth mutation (priv-esc), `systemInfo` secret field, alias batching, verbose errors | H |

### Business logic
| id | Where | Flaw |
|---|---|---|
| `bl-price` | `POST /api/checkout` | amount charged is taken from the client (`total=0.01`) |
| `bl-negative` | `POST /api/cart/add` | negative quantity → negative (credit) line total |
| `bl-coupon` | `POST /api/checkout/apply-coupon` | discount percent uncapped (>100% pays the customer) |
| `bl-status` | `POST /api/orders/{id}/status` | set any order status (ship/refund without payment) |
| `payment-confirmation` | `POST /api/orders/confirm` | a confirmation code from *any* paid order confirms anyone's order (fulfilment without paying) |
| `bl-modifier` | `POST /api/cart/price` | modifier prices summed with no dedupe / floor — duplicating or negative-priced add-ons drive the total below zero |
| `bl-fee-omit` | `POST /api/campaigns/boost` | `additional_fee:0` is rejected, but **omitting** the field enables the paid add-on for free |

### Authentication, identity & cross-origin
| id | Where | Type |
|---|---|---|
| `reg-user-enum` | `POST /api/register` | username enumeration ("already taken") |
| `login-user-enum` | `POST /api/v1/login` | "no such user" vs "incorrect password" |
| `user-enum` | `POST /api/forgot-password` | account enumeration |
| `cors` | `GET /api/account/data` | reflected `Origin` + `Allow-Credentials` |
| `host-header` | `POST /api/password/reset` | reset link built from `Host` (poisoning) |
| `csrf` | `GET /api/account/email` | state change over GET, no token |
| `csv-injection` | `GET /api/export.csv` | spreadsheet formula injection (`=`,`+`,`-`,`@`) |
| `cache-poisoning` | `GET /api/config/client` | unkeyed `X-Forwarded-Host` reflected into a `Cache-Control: public` response (poisoning / deception) |
| `unicode-collision` | `POST /api/account/recover` | NFKC/case-fold identifier collision → recovery token for a look-alike account (0-click ATO) |
| `reset-host-param` | `POST /api/account/reset-link` | reset link host taken from a client-controlled `hostName` body field |
| `reset-token-referer` | `GET /reset?token=` | reset token carried in the URL + a third-party tracker → token leaks via `Referer` |

API versions share a resource at `v1`/`v2`/`v3` where only `v3` is secure
(`ver-sqli` on v1, `ver-idor` on v2 — see above).

### Hidden XHR endpoints (referenced only in `app.js`, never called)
Find these by reading `/static/js/app.js` (`window.BOXCUTTER.internal`):

| id | Where | Issue |
|---|---|---|
| `hidden-sqli` | `/api/internal/user-lookup?email=` | SQL injection |
| `hidden-error` | `/api/internal/debug-report?id=` | verbose error disclosure (leaks JWT secret + flag) |
| `ssrf` | `/api/internal/fetch?url=` | server-side request forgery |

### Method × auth resource matrix

Eight ordinary-looking endpoints each hide one bug and **behave normally for
valid input** — the name gives nothing away, so a scanner has to probe. Every one
accepts **GET / PUT / POST / DELETE**; half require a bearer JWT (mint one from
`/api/auth/token`). All 32 operations are in the OpenAPI doc.

| Bug (`id`) | Open (no auth) | Auth (JWT) | Field | Normal vs attack |
|---|---|---|---|---|
| `res-error` | `/api/shipping/quote` | `/api/account/statement` | `weight` / `month` | a number → a cost; non-numeric → verbose error leaking secrets + flag |
| `res-sqli` | `/api/promos` | `/api/account/orders` | `code` / `status` | a real value → normal result; `'` / `' OR '1'='1` → SQL error / dump |
| `res-ssti` | `/api/messages/preview` | `/api/account/signature` | `message` / `signature` | `Hi {{ customer }}` → greeting; `{{7*7}}` → `49` |
| `res-idor` | `/api/orders/track` | `/api/account/invoices` | `order` / `id` | your order → details; any other id → someone else's address + card |

Input comes from the query string (GET/DELETE) or the JSON body (POST/PUT).

## Authentication per endpoint

`none` = no auth · `JWT` = bearer token required · `JWT*` = token required but the
action is **admin-only and the role is not checked** (broken function-level auth) ·
`JWT (secure)` = token **and** ownership/role enforced (the intended behaviour).

### Accounts & users
| Endpoint | Auth |
|---|---|
| `POST /api/register`, `POST /api/login`, `POST /api/v1/login`, `POST /api/v2/login` | none |
| `GET /api/auth/token` (JWTTest) | none |
| `GET /api/me`, `GET/POST /api/profile`, `POST /api/account` | JWT |
| `POST /api/profile/update` (target by `user_id`) | JWT (no ownership check → IDOR) |
| `GET /api/account/profile-by-id?user_id=` | JWT (no ownership check → IDOR) |
| `GET /api/users/{id}` | none (IDOR) |
| `GET /api/v1/users/{id}` | none (legacy, SQLi) |
| `GET /api/v2/users/{id}` | JWT (IDOR) |
| `GET /api/v3/users/{id}` | JWT (secure) |
| `POST /api/account/recover`, `POST /api/account/reset-link` | none (unicode-collision ATO / `hostName` reset poisoning) |
| `GET /api/account/reports` | JWT (no tenant check → cross-tenant) |

### Orders, checkout & payments
| Endpoint | Auth |
|---|---|
| `POST /api/orders`, `POST /api/payments/charge`, `POST /api/orders/confirm`, `GET /api/orders/{id}/state`, `POST /api/vouchers/redeem` | none |
| `GET /api/orders/track`, `GET /api/users/{id}/orders` | none (IDOR) |
| `GET /api/orders/{id}`, `GET /api/orders/{id}/invoice`, `GET/PUT /api/account/addresses/{id}` | JWT (no ownership → IDOR) |
| `POST /api/orders/{id}/status`, `POST /api/orders/{id}/notes` (POST) | none (business-logic / method bypass) |
| `POST /api/cart/price` | none (business-logic: modifier multiplication) |
| `POST /api/menu/items/update` | JWT (no ownership → secondary-context IDOR) |
| `POST /api/campaigns/boost` | JWT (business-logic: fee-omission bypass) |

### Admin & privileged actions
| Endpoint | Auth |
|---|---|
| `GET /api/admin/users` | JWT (secure: admin role enforced) |
| `GET /api/admin/search` | JWT |
| `POST /api/admin/refund`, `POST /api/admin/delete-user`, `PUT /api/admin/products/{id}/price`, `POST /api/coupons/generate` | JWT* (no role check) |
| `GET /api/admin/console` | "JWT" (signature not verified — alg:none) |
| `GET /api/admin/stats` | none (`X-Admin` header) |
| `GET /api/admin/metrics` | none (`X-Forwarded-For`) |
| `GET /api/v1/users`, `GET /api/internal/*`, `GET /exports/*` | none (hidden / predictable) |

### CMS, GraphQL & misc API
| Endpoint | Auth |
|---|---|
| `POST /graphql` (incl. `setRole` / `updateHelpArticle` mutations) | none |
| `POST /api/orders/import` (XXE), `GET /api/preferences`, `POST /api/avatar`, `GET /uploads/{name}` | none |
| `GET /api/directory`, `GET /api/staff`, `GET /api/export.csv`, `GET /api/tools/dns`, `GET /api/files` | none |
| `POST /api/password/reset`, `POST /api/forgot-password` | none |
| `GET /api/account/data` (CORS), `GET/POST /api/account/email` (CSRF) | JWT |
| `/api/account/orders` `…/signature` `…/statement` `…/invoices` | JWT |
| `GET /api/config/client` | none (cacheable; unkeyed `X-Forwarded-Host`) |

(Storefront pages — `/`, `/search`, `/product`, `/reviews`, `/blog`, `/help`,
`/download`, `/redirect`, `/reset`, `/phpinfo`, exposures — are all unauthenticated.)

## Logging

Every request — method, path (with query string), status, whether a bearer token
was sent, user-agent, and the body for writes — is appended as one JSON line per
request to a **daily** file `logs/requests-YYYY-MM-DD.log`. Configurable via env:

- `BOXCUTTER_LOG_ENABLED=0` — turn logging off (default: on)
- `BOXCUTTER_LOG_DIR=/path` — where the daily files go (default: `./logs`)

Mount it out of the container to keep the logs:

```bash
docker run --rm -p 8000:8000 -v "$PWD/logs:/app/logs" boxcutter-store
```

## Where to start

Good first targets for any scanner or manual session:

- **Crawl + content discovery**: `/`, `/robots.txt`, `/sitemap.xml`, then dir/file
  brute-force (`/admin`, `/debug`, `/.env`, `/.git/config`, `/actuator`, `/backup.sql`).
- **API**: read `/api/openapi.json` (Swagger UI at `/api/docs`), enumerate `/api/v1`–`/api/v3`,
  grab a JWT from `/api/auth/token`, then exercise the authenticated endpoints.
- **Injection**: parameters on `/search`, `/product?id=`, `/api/products?q=`, `/greet?name=`,
  the `/api/lab/*` matrix, and the GraphQL endpoint `/graphql`.
- **Secrets / JS**: `/static/js/config.js` and `/static/js/app.js` (keys + hidden routes).

## Verifying with boxcutter

Two layers of verification:

- **`python checks.py`** — exploits **every** planted bug directly (ground truth, ~100 checks). Use this to prove a finding is real.
- **boxcutter** — confirms the subset an automated scanner can reach, grouped below. (If boxcutter runs in a container and the app on your host, use `http://host.docker.internal:8000`.)

```bash
# one token for the auth-gated groups
TOKEN=$(curl -s -X POST http://localhost:8000/api/login \
  -H 'Content-Type: application/json' -d '{"username":"user","password":"user"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['token'])")
```

| Finding group | boxcutter command | Confirms |
|---|---|---|
| **Everything (one shot)** | `boxcutter workflow web-scan http://localhost:8000 --header "Authorization: Bearer $TOKEN"` | crawl + spec + JS routes + param DAST + exposures |
| **Exposures / info-disclosure** | `boxcutter nuclei http://localhost:8000 --opt-args "-tags exposures,misconfig,springboot"` and `boxcutter dirsearch http://localhost:8000` | `.env`, `.git/config`, actuators, heapdump, `backup.sql`, phpinfo |
| **Secrets in JS** | `boxcutter scan-secrets http://localhost:8000/static/js/config.js` | AWS / Stripe / JWT keys |
| **API discovery** | `boxcutter swagger-specs localhost:8000` | finds `/api/openapi.json` |
| **API injection (authed)** | `boxcutter workflow swagger-fuzz http://localhost:8000/api/openapi.json --header "Authorization: Bearer $TOKEN"` | SQLi / SSTI / cmd / reflection on documented endpoints |
| **Storefront injection** | `boxcutter fuzz "http://localhost:8000/search?q=1"` and `boxcutter fuzz "http://localhost:8000/product?id=1"` | reflected XSS, SQLi (error/blind/time) |
| **Hidden XHR routes** | `boxcutter js-endpoints http://localhost:8000/static/js/app.js` (absolute URLs) → `boxcutter fuzz` each `?param` route | hidden SQLi / SSRF / error-disclosure |
| **ZAP active scan (authed)** | `boxcutter zap-scan-openapi http://localhost:8000/api/openapi.json --header "Authorization: Bearer $TOKEN"` | ZAP's view of the API (note: rates some SQLi `High (Low)` → raise confidence to see it) |

**Not auto-verifiable by the scanner — use `checks.py`:** access-control / IDOR / BFLA / tenant-isolation, business logic (price, coupon, payment-confirmation replay, fee-omit), client-side / DOM XSS, GraphQL (introspection / secret field / `setRole` / CMS), and the JWT-`kid`/`alg:none` forgeries. These need an auth oracle, a JS engine, or a known request — outside single-pass DAST.
