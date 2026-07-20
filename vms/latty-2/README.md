### latty-2

**Latty-2** — a Vue 3 + Node/Express **internal ops "HTTP request tester"**, and a **lateral-movement
chain** built around **SSRF**. `demo/demo` is shown on the sign-in page.

```
docker build -t latty-2 ./vms/latty-2
docker run --rm -p 8080:80 latty-2      # http://localhost:8080
```

The container also runs a second, **internal-only** microservice bound to `127.0.0.1:9000` — it is
**not** published outside the container, so you can only reach it *through* the app.

#### The chain: SSRF → internal service → task token → run-task → RCE

1. Sign in (`demo/demo`) and use the **request tester** — `POST /api/fetch` (`VULN[ssrf]`). It performs
   a fully attacker-controlled request server-side (any URL, method, headers, body) and returns the
   response. No allowlist, so point it at the internal service:
   ```
   GET http://127.0.0.1:9000/          → lists the internal endpoints
   ```

2. Ask the internal service for a token — it trusts localhost:
   ```
   GET http://127.0.0.1:9000/token     → { "token": "int-ops-7f3a9c21" }
   ```

3. Run a maintenance task with that token (`VULN[rce]` in the internal service) — set the method to
   `POST`, add header `X-Admin-Token: int-ops-7f3a9c21`, and body `{"cmd":"id"}`:
   ```
   POST http://127.0.0.1:9000/run-task → { "output": "uid=0(root) …" }
   ```

The internal service is unreachable directly; the SSRF is the only way in, and its over-trust of
localhost turns a read-style SSRF into command execution. Deliberately insecure by design — run only
locally / on an isolated network.
