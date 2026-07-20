List of vulnerable machines for testing and training. Nothing more. Nothing less.

Every machine is automatically restarted **every 2 hours** (on even hours, local time).

> Deliberately insecure by design. For testing and training.

## Machines

Grouped by **purpose** — what skill each one exercises. Machine name links to source.

### General — broad vulnerability labs
Wide surface for practising many bug classes / discovery methodology.

| Machine | What it tests | Key vulnerabilities | Live |
|---|---|---|---|
| [**Boxcutter Store**](https://github.com/zzzteph/appsec.study/tree/main/vms/boxcutter-store) | Kitchen-sink web app — many classes at once | Mixed injection, XSS, broken access control, API & GraphQL, business logic, info disclosure | [boxcutter.appsec.study](https://boxcutter.appsec.study) |
| [**DVWA**](https://github.com/zzzteph/appsec.study/tree/main/vms/DVWA) (fork of [DVWA](https://github.com/digininja/DVWA)) | Classic per-category practice (adjustable difficulty) | SQLi (incl. blind), command injection, LFI/RFI, file upload, XSS (reflected/stored/DOM), CSRF, brute force, weak session IDs | [dvwa.appsec.study](https://dvwa.appsec.study) |
| [**Stalker**](https://github.com/zzzteph/appsec.study/tree/main/vms/Stalker) | Recover leaked VCS artifacts, then exploit | Leaked Git artifacts, hidden admin panel, SQL injection, code execution | [stalker.appsec.study](https://stalker.appsec.study) |
| [**nomnom**](https://github.com/zzzteph/appsec.study/tree/main/vms/nomnom) | REST **API testing** methodology (Swagger, ~117 endpoints) | BOLA/IDOR, BFLA, mass assignment, price tampering, referral race, SSRF, SQLi, JWT (alg:none/weak), XXE, SSTI, file upload, open redirect, CORS, GraphQL | [nomnom.appsec.study](https://nomnom.appsec.study) |
| [**graph**](https://github.com/zzzteph/appsec.study/tree/main/vms/graph) | **GraphQL** (Apollo) API testing | Pervasive BOLA/IDOR, invite-IDOR, hidden `recentUsers`, GraphQL SQLi, path traversal, mass-assignment, weak/leaked reset, price/option-price abuse, stored XSS, unauth CMS mutation | [graph.appsec.study](https://graph.appsec.study) |
| [**shoppy**](https://github.com/zzzteph/appsec.study/tree/main/vms/shoppy) | REST twin of graph (same shop, full REST API) | BOLA/IDOR, SQLi, path traversal, mass-assignment, price/coupon/refund/credits abuse, SSRF, file upload, stored XSS, impersonation, verbose errors | [shoppy.appsec.study](https://shoppy.appsec.study) |
| [**juicy**](https://github.com/zzzteph/appsec.study/tree/main/vms/juicy) | **JavaScript bundle analysis** (find secrets/endpoints/sinks) | Secrets & assembled/prefixed endpoints buried in bundles (minified, webpack, hex, base64, source-map leak); 8 DOM-XSS sinks behind hidden params | [juicy.appsec.study](https://juicy.appsec.study) |
| [**frontend-str-react**](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-react) | React-specific client-side sinks | `dangerouslySetInnerHTML`, `javascript:` href, props-spread injection, dynamic-component render | [freact.appsec.study](https://freact.appsec.study) |
| [**frontend-str-vue**](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-vue) | Vue-specific client-side sinks | `v-html`, `:href` `javascript:`, runtime-compiler CSTI, `<component :is>` | [fvue.appsec.study](https://fvue.appsec.study) |
| [**frontend-str-angular**](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-angular) | Angular-specific client-side sinks | `bypassSecurityTrust*` (HTML/URL/ResourceUrl), open redirect, JIT CSTI | [fangular.appsec.study](https://fangular.appsec.study) |

### Edge-cases — one specific tricky behavior
Each isolates a single mechanic that trips up scanners/agents.

| Machine | What it tests | Key vulnerabilities | Live |
|---|---|---|---|
| [**ghost**](https://github.com/zzzteph/appsec.study/tree/main/vms/ghost) | **Code-splitting** — API surface only appears in a chunk loaded *after* login (`demo/demo`) | Multiple BOLA on every by-id endpoint (orders read/approve/deliver/decline, invoices, inventory edit/delete, shop stats) | [ghost.appsec.study](https://ghost.appsec.study) |
| [**refreshy**](https://github.com/zzzteph/appsec.study/tree/main/vms/refreshy) | **Authorization across token refresh** — 2-min JWT access + refresh | Stored XSS (posts/comments), SQLi (search), BOLA (edit/delete any user's post) | [refreshy.appsec.study](https://refreshy.appsec.study) |

### Lateral movement — multi-step / chain to RCE
No shortcut: each stage gates the next until code execution. (loggie/reggie also test multi-step **auth**.)

| Machine | Chain (what it tests) | Primitive → sink | Live |
|---|---|---|---|
| [**latty-1**](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-1) | Blog | SQLi (UNION) → **cleartext** creds → admin login → report **SSTI → RCE** | [latty1.appsec.study](https://latty1.appsec.study) |
| [**latty-2**](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-2) | Ops request-tester | **SSRF** → internal-only `127.0.0.1:9000` svc → task token → `run-task` **cmd-exec → RCE** | [latty2.appsec.study](https://latty2.appsec.study) |
| [**latty-3**](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-3) | Contact-import + backup | **XXE** → service config creds → **password reuse** → backup **command-injection → RCE** | [latty3.appsec.study](https://latty3.appsec.study) |
| [**latty-4**](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-4) | Projects + report builder | **IDOR** (`/projects/:id`) → leaked scoped **API key** → report builder **EJS SSTI → RCE** | [latty4.appsec.study](https://latty4.appsec.study) |
| [**latty-5**](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-5) | Docs portal + extensions | **LFI** (`?file=../…`) → HS256 JWT secret → **forge admin** → unrestricted `.js` upload → **webshell → RCE** | [latty5.appsec.study](https://latty5.appsec.study) |
| [**lstalker**](https://github.com/zzzteph/appsec.study/tree/main/vms/lstalker) | Stalker variant (no `.git`) | SQLi → **cleartext** creds → hidden admin panel → `eval` **RCE** (content-discovery, not Git recovery) | [lstalker.appsec.study](https://lstalker.appsec.study) |
| [**loggie**](https://github.com/zzzteph/appsec.study/tree/main/vms/loggie) | **Multi-step login** (creds `demo/demo` + captcha checkbox) | Post-login **RCE**; code-split (RCE surface hidden until login); 1-min JWT access + refresh | [loggie.appsec.study](https://loggie.appsec.study) |
| [**reggie**](https://github.com/zzzteph/appsec.study/tree/main/vms/reggie) | **Register → login** (no creds given; captcha each step) | Post-login **RCE**; code-split; 1-min JWT access + refresh | [reggie.appsec.study](https://reggie.appsec.study) |

### Procedural — self-mutating
| Machine | What it tests | Key vulnerabilities | Live |
|---|---|---|---|
| [**maze**](https://github.com/zzzteph/appsec.study/tree/main/vms/maze) | A **"maze for scanners"**: a different app + a different vuln **chain every restart**, seed-reproducible; UI decoupled from vulns; `GET /api/manifest` shows live routes but not which bugs are on — you must fingerprint | Procedurally combines SQLi/LFI/XXE/SSRF/SSTI/cmd-inj/upload/deserialization/IDOR/XSS/… across REST/GraphQL/traditional × JWT/session/API-key; **always guarantees ≥1 chain to RCE** | [maze.appsec.study](https://maze.appsec.study) |

## Scanner coverage

Planted vulnerabilities each scanner discovered (valid findings / total embedded). A new column is added per scan.

| Machine | boxcutter `web-full` (unauthed) |
|---|---|
| Boxcutter Store | 19 / 109 |
| DVWA | 9 / 14 |
| nomnom | 5 / 42 |
| Stalker | 1 / 4 |
| frontend-str-react | 0 / 5 |
| frontend-str-vue | 0 / 5 |
| frontend-str-angular | 0 / 5 |
| juicy | — |
| graph | — |
| lstalker | — |
| shoppy | — |
| refreshy | — |
| ghost | — |
| latty-1 | — |
| latty-2 | — |
| latty-3 | — |
| latty-4 | — |
| latty-5 | — |
| loggie | — |
| reggie | — |
| maze | — |


