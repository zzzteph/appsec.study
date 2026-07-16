### juicy

A static SPA ("Juicy" juice bar) whose whole purpose is **JavaScript analysis** — training agents
and scanners to mine JS bundles for **secrets**, **hidden/assembled endpoints**, and **DOM-XSS
sinks**. There is no backend; everything interesting is buried in the JS at varying obfuscation
depth. **The JS has no comments** (on purpose) — this README is the only answer key.

```
docker build -t juicy ./vms/juicy
docker run --rm -p 8080:80 juicy      # http://localhost:8080
```

All bundles are under `/js/`. A JS-aware crawler should enumerate and read every one.

#### 1. Secrets & hidden endpoints (7 files, increasing difficulty)

| File | Technique | What's hidden |
|---|---|---|
| `config.min.js` | minified, plain strings | AWS key/secret, Stripe `sk_live_…`, Google Maps key, Sentry DSN |
| `runtime-env.js` | injected env object | internal host `http://10.8.0.12:8080/_int/8b21/internal`, admin API base, Firebase/Segment/LaunchDarkly keys |
| `sdk.js` | base64 JSON blob + `String.fromCharCode` | `sdk_live_JuicyBar_7f3a` token, `/gw/7f3a9c/api/v2/payments/charge`, `/edge/d4/api/v3/telemetry` |
| `app.js` | endpoints **assembled** from string fragments | `/gw/7f3a9c/api/v2/{products,orders,account/me,cart,coupons/redeem,search,checkout}` (no literal path — trace `path()`) |
| `main.bundle.js` | webpack module map + fragment joins | JWT secret `juicybar-jwt-s3cr3t-k3y-2024`, service token, `/_int/8b21/internal/admin/{users,flags}`, `/_int/8b21/internal/metrics`, `/gw/7f3a9c/api/v2/coupons/redeem` |
| `vendor.obf.js` | string-array + `\xNN` hex escapes | admin token `adm_live_9f8e7d6c5b4a3f2e`, header `X-Admin-Token`, `/edge/d4/api/debug/config` |
| `chunk.4f2a.min.js` → `.map` | **source-map leak** (`sourceMappingURL`) | the `.map`'s `sourcesContent` reveals `whsec_JuicyBar_live_7c1d9e4b`, `/edge/d4/api/v3/keys`, `/_int/8b21/internal/keys/rotate` |

**Non-obvious prefixes (dirbust-proof).** Every route sits under an unguessable prefix —
`/gw/7f3a9c` (gateway), `/_int/8b21` (internal), `/edge/d4` (edge/debug) — that no directory
brute-force wordlist contains. Hitting `/api/v2/products`, `/admin`, `/internal/admin/users`, etc.
returns **404**; only the JS reveals the real prefix. The endpoints are also **not** written as
literal strings (except in the leaked source map) — they're built from arrays/joins/char-codes, so
`grep` misses them and you have to read/evaluate the code. Discovered routes **respond** with mock
JSON (nginx), so an agent that extracts a route gets a real 200, not a dead end.

#### 2. DOM-based XSS (8 sinks, increasing depth)

Each is driven by a **non-obvious hidden param** and a different sink; some chain several transforms
between source and sink. Payloads assume the page is open at `/`.

| File | Param | Depth | Sink | Example |
|---|---|---|---|---|
| `track.js` | `ref` | 1 | anchor `href` (`javascript:`) | `/?ref=javascript:alert(document.domain)` then click "keep shopping" |
| `legacy.js` | `w_x` | 1 | `document.write` | `/?w_x=<script>alert(1)</script>` |
| `debug.js` | `j_x` | 1 | `new Function()` | `/?j_x=alert(document.domain)` |
| `widget.js` | `tpl` | 2 | `innerHTML` (after template replace) | `/?tpl=<svg onload=alert(1)>` |
| `render.js` | `s_x` | 2 | `innerHTML` (hash+query, optional base64) | `/#s_x=<img src=x onerror=alert(document.domain)>` |
| `router.js` | `v_x` | 3 | `insertAdjacentHTML` (hash route → shared state → deferred render) | `/#/home?v_x=<img src=x onerror=alert(1)>` |
| `deeplink.js` | `d_x` | 4 | `innerHTML` via `$().html()` shim (URL→base64→JSON→`.html`) | `/?d_x=eyJodG1sIjogIjxpbWcgc3JjPXggb25lcnJvcj1hbGVydChkb2N1bWVudC5kb21haW4pPiJ9` |
| `messagebus.js` | `m_x=1` | x-window | `innerHTML` via `postMessage` (no origin check) | open `/?m_x=1`, then from another window `postMessage({html:'<img src=x onerror=alert(1)>'}, '*')` |

#### 3. Deeper JS-analysis challenges (Batch 2)

| Challenge | File(s) | What to recover / do |
|---|---|---|
| **GraphQL from JS** | `graphql.js` | Endpoint `/gw/7f3a9c/graphql` + operations `Me`, `AdminUsers` with persisted-query sha256 hashes. POST the persisted query (`extensions.persistedQuery.sha256Hash`) → the mock returns an admin record incl. token `adm_live_9f8e7d6c5b4a3f2e`. |
| **Feature-flag-gated route** | `features.js` | `/gw/7f3a9c/api/v2/admin/console` and `/_int/8b21/internal/admin/impersonate` are only referenced inside the `if (flags.beta || ?ff=admin_console)` branch — read the branch to surface them. Try `/?ff=admin_console`. |
| **Lazy-loaded chunk** | `loader.js` → `async.7f3a.js`, `async.9c21.js` | The chunk manifest `{7:"async.7f3a.js",9:"async.9c21.js"}` names files **not linked in HTML**. Follow it: `async.7f3a.js` leaks `pk_live_JuicyPay_b2c4e6` + `/gw/7f3a9c/api/v2/payments/intent`; chunk 7 auto-loads with `/?pay=1`. |
| **JS → auth bypass (end-to-end)** | `session.js` | HS256 secret `hs256-juicybar-9f2c7a4d` is assembled in JS. Forge a JWT `{"alg":"HS256"}` / `{"sub":"x","role":"admin"}` signed with it, pass via `/?jwt=<token>` (or `localStorage.jb_jwt`). The client **verifies the signature** (WebCrypto) → admin console unlocks + calls `/…/admin/console`. (Needs a secure context: https or `localhost`.) |
| **`__NEXT_DATA__`** | `index.html` | `<script id="__NEXT_DATA__" type="application/json">` embeds `internalToken: int_live_JuicyBar_7d21c9`, `adminApi`, the GraphQL endpoint and `buildId` — data blobs count, not just `.js`. |
| **Client-side auth gate** | `gate.js` | `/?staff=juicy-staff-2024` passes a **client-side** sha256 gate (`window.__staff=true`). The decision never leaves the browser — bypassable by reversing the hash or just setting the flag. |
| **Magic debug toggle** | `debugtoggle.js` | Only the **hash** of the magic value is in JS. `/?dbg=unlock-b3ta` matches it → debug mode reveals `/edge/d4/api/debug/{config,state}` and `dbg_live_JuicyBar_5a7f`. |
| **Import-map override** | `index.html` + `js/vendor/utils.mjs` | The `<script type="importmap">` maps bare specifiers (`@juicy/utils`, `@juicy/track` → `https://cdn.juicy.example/…`) — discloses dependency hosts, and `utils.mjs` leaks `/gw/7f3a9c/api/v2/push/register` + a VAPID key. **Override risk:** any HTML-injection XSS here can inject an additional/earlier import map to remap `@juicy/utils` to attacker JS and hijack the module import (supply-chain / RCE-in-page). |

Deliberately insecure by design — run only locally / on an isolated network.
