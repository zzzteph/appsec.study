### ghost

**Ghost** — a Vue 3 + Node/Express **order-management** app for shops: incoming orders (generated
at random), approve / send-to-delivery / decline, invoices + payments, and an inventory (qty + price)
that feeds new orders. JWT auth, in-memory store.

```
docker build -t ghost ./vms/ghost
docker run --rm -p 8080:80 ghost      # http://localhost:8080
```

Landing page shows the **`demo / demo`** account; also `alice/alice`, `bob/bob`, `carol/carol`
(each is a shop). Orders keep arriving on a timer.

#### The trick: nothing until you log in
The initial bundle contains **only the landing/login**. The dashboard and the **API client are
code-split into a separate chunk that loads on demand after a successful login** — so an
unauthenticated crawler reading the served JS sees `POST /api/login` and nothing else; the rest of
the API surface (`/api/orders`, `/api/inventory`, `/api/invoices`, …) is only referenced from the
post-login chunk. You have to authenticate to discover the app.

#### Planted vulnerabilities — **multiple BOLA** (`VULN[bola]` in `server/routes.js`)
Every id-taking endpoint skips the ownership check, so with any valid token you can reach **other
shops'** data and act on it:

| Endpoint | BOLA |
|---|---|
| `GET /api/orders/:id` | read any shop's order |
| `POST /api/orders/:id/{approve,deliver,decline}` | change the status of **any** shop's order |
| `GET /api/invoices/:id` | any invoice (customer + totals) |
| `PATCH /api/inventory/:id`, `DELETE /api/inventory/:id` | edit / delete any shop's inventory |
| `GET /api/shops/:id` | any shop's revenue/stats |

(The list endpoints `GET /api/orders`, `/inventory`, `/invoices`, `/payments` are correctly scoped to
your own shop — the leak is the by-id endpoints.)

Deliberately insecure by design — run only locally / on an isolated network.
