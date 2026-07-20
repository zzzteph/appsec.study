### loggie

**Loggie** — a deliberately tiny Vue 3 + Node/Express app whose point is a **multi-step login**. The
sign-in page shows `demo / demo` and an **"I'm not a robot" checkbox that must be ticked** (a bare-bones
captcha). Only after a successful login does the app reveal an **RCE** tool.

```
docker build -t loggie ./vms/loggie
docker run --rm -p 8080:80 loggie      # http://localhost:8080
```

#### What it tests
Can an agent/scanner drive a real login flow — fill credentials **and** satisfy the checkbox — before it
can reach anything interesting? Two extra wrinkles:

- **Code-split.** The dashboard and its API client (which reference `POST /api/run`) are in a chunk that
  loads **only after login**. The initial bundle references `POST /api/login` and nothing else, so an
  unauthenticated crawler never sees the RCE endpoint.
- **1-minute access token + refresh.** `POST /api/login` returns a JWT **access token that expires after
  60 seconds** plus a refresh token; the RCE endpoint requires a live access token, so long-running
  tooling must refresh (`POST /api/refresh`) to keep acting.

#### The vulnerability
- `POST /api/login` — requires `captcha: true` **and** valid creds (`demo`/`demo`); returns `{access, refresh}`.
- `POST /api/run` (`VULN[rce]`, auth-required) — runs a shell command (`execSync`). Reachable only with a
  valid, non-expired access token, i.e. only after logging in.

Deliberately insecure by design — run only locally / on an isolated network.
