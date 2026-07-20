### refreshy

A tiny **Vue 3 + Node/Express** social feed (posts, ratings, comments) with a **SQLite** backend.
Its reason to exist is the **auth model**: the **access token lives 2 minutes**, and every write
requires a non-expired one — when it expires the server returns `401 {expired:true}` and you must
exchange the **refresh token** at `POST /api/refresh` for a new access token. The goal is to see how
well agents/scanners sustain an authenticated session **across token refresh**.

```
docker build -t refreshy ./vms/refreshy
docker run --rm -p 8080:80 refreshy      # http://localhost:8080
```

Accounts: `demo/demo` (shown on the page), plus `alice/alice`, `bob/bob`, `carol/carol`. The SPA
refreshes the access token automatically; a client that doesn't will start failing writes after 2 min.

#### Auth flow
- `POST /api/login` / `POST /api/register` → `{ accessToken (2m), refreshToken (1d), user }`
- writes send `Authorization: Bearer <access>`; on `401 {expired:true}` →
- `POST /api/refresh { refreshToken }` → `{ accessToken }`, then retry.

#### Planted vulnerabilities (`VULN[id]` in `server/routes.js`)
| `VULN[id]` | Where | Notes |
|---|---|---|
| `sqli` | `GET /api/posts?search=` | search concatenated into SQL (error-based; UNION-able against `users`) |
| `error-disclosure` | same | SQLite error returned on a broken query |
| `xss-stored` | post body + comment body (`v-html`) | `<img src=x onerror=alert(1)>` in a post/comment |
| `bola` | `PATCH /api/posts/:id`, `DELETE /api/posts/:id` | no ownership check — edit/delete **any** user's post (the UI only shows the buttons on your own) |

Example — BOLA: log in as `bob`, then `PATCH /api/posts/1` (alice's post) or `DELETE /api/posts/1`
with your bearer token — it succeeds. SQLi: `GET /api/posts?search=' UNION SELECT 1,1,username,password,'x','y' FROM users -- `.

Deliberately insecure by design — run only locally / on an isolated network.
