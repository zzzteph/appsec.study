### latty-4

**Latty-4** — a Vue 3 + Node/Express **projects dashboard** with a **report builder**, and a
**lateral-movement chain** that starts with **IDOR**. `demo/demo` on the sign-in page.

```
docker build -t latty-4 ./vms/latty-4
docker run --rm -p 8080:80 latty-4      # http://localhost:8080
```

#### The chain: IDOR → leaked API key → report-builder SSTI → RCE

1. Sign in as `demo/demo`. `GET /api/projects` shows only your own project (scope `read`), and the
   report builder rejects your key (`missing scope: reports`).

2. **IDOR** (`VULN[idor]`, `GET /api/projects/:id`). Fetch-by-id skips the ownership check and returns
   the **full** record — including each project's `apiKey` and `scopes`. Enumerate ids to find a key
   with the `reports` scope, e.g. project **#2** (`globex`) → `gx_live_9d4b7a2e5f10`.

3. **Report-builder SSTI → RCE** (`VULN[rce]`, `POST /api/reports/render`, gated by `X-API-Key` with
   the `reports` scope). Templates are rendered with **EJS**, which executes arbitrary JS:
   ```
   X-API-Key: gx_live_9d4b7a2e5f10
   template: <%= process.mainModule.require('child_process').execSync('id') %>
   ```
   → command execution on the server.

Your own key can't reach the builder, and the powerful key never appears in your own project list —
the IDOR is the pivot. Deliberately insecure by design — run only locally / on an isolated network.
