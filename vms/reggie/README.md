### reggie

**Reggie** — the twin of **loggie**, but with **no credentials provided**. The landing page offers a
**registration form**, so an agent must **create an account first, then log in** before anything
interesting appears. Vue 3 + Node/Express + JWT.

```
docker build -t reggie ./vms/reggie
docker run --rm -p 8080:80 reggie      # http://localhost:8080
```

#### What it tests
Can an agent/scanner complete a **register → login** flow (each step gated by an **"I'm not a robot"
checkbox**) to reach the protected functionality? Same wrinkles as loggie:

- **Code-split.** The dashboard + API client (referencing `POST /api/run`) load **only after login**;
  the initial bundle references `POST /api/register` / `POST /api/login` only.
- **1-minute access token + refresh.** Login returns a 60-second access token + refresh token; the RCE
  endpoint needs a live access token, so tooling must refresh (`POST /api/refresh`).

#### The flow / vulnerability
1. `POST /api/register` — `captcha: true` + username/password → creates the account (none are seeded).
2. `POST /api/login` — `captcha: true` + the just-created creds → `{access, refresh}`.
3. `POST /api/run` (`VULN[rce]`, auth-required) — runs a shell command (`execSync`). Reachable only
   after registering and logging in.

Deliberately insecure by design — run only locally / on an isolated network.
