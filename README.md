List of vulnerable machines for testing and training. Nothing more. Nothing less.

Every machine is automatically restarted **every 2 hours** (on even hours, local time).

> Deliberately insecure by design. For testing and training.

## Machines

| Machine | Vulns | Source | Live |
|---|---|---|---|
| **Boxcutter Store** | Mixed injection, XSS, broken access control, API & GraphQL, business logic, info disclosure | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/boxcutter-store) | [boxcutter.appsec.study](https://boxcutter.appsec.study) |
| **Stalker** | Leaked Git artifacts, hidden admin panel, SQL injection, code execution | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/Stalker) | [stalker.appsec.study](https://stalker.appsec.study) |
| **DVWA** (fork of [DVWA](https://github.com/digininja/DVWA)) | SQL injection (incl. blind), command injection, file inclusion (LFI/RFI), file upload, XSS (reflected/stored/DOM), CSRF, brute force, weak session IDs | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/DVWA) | [dvwa.appsec.study](https://dvwa.appsec.study) |
| **frontend-str-react** | React-specific client-side bugs: `dangerouslySetInnerHTML`, `javascript:` href, props-spread injection, dynamic-component render | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-react) | [freact.appsec.study](https://freact.appsec.study) |
| **frontend-str-vue** | Vue-specific client-side bugs: `v-html`, `:href` `javascript:`, runtime-compiler CSTI, `<component :is>` | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-vue) | [fvue.appsec.study](https://fvue.appsec.study) |
| **frontend-str-angular** | Angular-specific client-side bugs: `bypassSecurityTrust*` (HTML/URL/ResourceUrl), open redirect, JIT CSTI | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/frontend-str-angular) | [fangular.appsec.study](https://fangular.appsec.study) |
| **nomnom** | Food-ordering REST API (~117 endpoints, Swagger UI): BOLA/IDOR, BFLA, mass assignment, price tampering, referral race condition, SSRF, SQLi, JWT (alg:none/weak secret), XXE, SSTI, file upload, open redirect, CORS, GraphQL | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/nomnom) | [nomnom.appsec.study](https://nomnom.appsec.study) |
| **juicy** | JS-analysis SPA: secrets & assembled/prefixed endpoints buried in bundles at varied obfuscation (minified, webpack, hex, base64, source-map leak) + 8 DOM-XSS sinks behind hidden params | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/juicy) | [juicy.appsec.study](https://juicy.appsec.study) |
| **graph** | Vue + GraphQL (Apollo) shop, JWT access/refresh: pervasive BOLA/IDOR, invite-IDOR, hidden `recentUsers`, GraphQL SQLi, path traversal, mass-assignment, weak/leaked reset, price-tamper, option-price abuse, stored XSS (reviews/CMS), unauth CMS mutation, enumeration | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/graph) | [graph.appsec.study](https://graph.appsec.study) |
| **lstalker** (variant of [Stalker](https://github.com/zzzteph/appsec.study/tree/main/vms/Stalker)) | SQL injection → **cleartext** credential disclosure → hidden admin panel → `eval` RCE. No `.git` — content-discovery instead of Git recovery | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/lstalker) | [lstalker.appsec.study](https://lstalker.appsec.study) |
| **shoppy** (REST twin of [graph](https://github.com/zzzteph/appsec.study/tree/main/vms/graph)) | Same shop, **full REST API** (Express) + JWT access/refresh: BOLA/IDOR, SQLi, path traversal, mass-assignment, price/coupon/refund/credits abuse, SSRF, file upload, stored XSS, impersonation, verbose errors | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/shoppy) | [shoppy.appsec.study](https://shoppy.appsec.study) |
| **refreshy** | Vue + Node/Express social feed; the point is the **2-min JWT access token + refresh** flow (authorization-session testing). Stored XSS (posts/comments), SQLi (search), BOLA (edit/delete any user's post) | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/refreshy) | [refreshy.appsec.study](https://refreshy.appsec.study) |
| **ghost** | Vue + Node/Express order-management for shops; the point is **code-splitting** — the API client + dashboard load in a chunk only *after* login, so the API surface is invisible to an unauthenticated crawler. **Multiple BOLA** on every by-id endpoint (orders read/approve/deliver/decline, invoices, inventory edit/delete, shop stats). `demo/demo` on the landing page | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/ghost) | [ghost.appsec.study](https://ghost.appsec.study) |
| **latty-1** | Vue + Node/Express blog that is a **lateral-movement chain to RCE**: SQLi (search, UNION) → **cleartext** credential dump → admin login → invoice/report generator **SSTI → RCE**. Each stage gates the next | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-1) | [latty1.appsec.study](https://latty1.appsec.study) |
| **latty-2** | Vue + Node/Express ops "request tester"; **lateral-movement chain via SSRF**: full-SSRF fetch → **internal-only** microservice on `127.0.0.1:9000` (unpublished) → localhost-trusted task token → `run-task` **command execution → RCE**. `demo/demo` | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-2) | [latty2.appsec.study](https://latty2.appsec.study) |
| **latty-3** | Vue + Node/Express contact-import + backup console; **lateral-movement chain via XXE**: XXE (external entity, `libxmljs2`) reads service config → leaked creds → **password reuse** into admin console → backup **command injection → RCE** | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-3) | [latty3.appsec.study](https://latty3.appsec.study) |
| **latty-4** | Vue + Node/Express projects dashboard + report builder; **lateral-movement chain via IDOR**: `GET /projects/:id` IDOR leaks another tenant's **API key** (with `reports` scope) → report builder **EJS SSTI → RCE**. `demo/demo` | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-4) | [latty4.appsec.study](https://latty4.appsec.study) |
| **latty-5** | Vue + Node/Express docs portal + extension console; **lateral-movement chain via LFI**: path-traversal (`?file=../…`) leaks the **HS256 JWT secret** → forge `role:admin` token → **unrestricted `.js` upload** → `require()`-and-run **webshell → RCE** | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/latty-5) | [latty5.appsec.study](https://latty5.appsec.study) |
| **mutie** | **Self-mutating** app (Vue Material Design + Node/Express): assembled from ~38 feature blocks across admin/partner/shop/social, a random subset live each restart with a random subset of vulns (SQLi/LFI/XXE/SSRF/SSTI/cmd-inj/upload/IDOR/XSS/…). `GET /api/manifest` shows live routes but not which bugs are on — you fingerprint. Generator **always guarantees ≥1 chain to RCE** (creds/forge/ssrf); re-mutates on restart | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/mutie) | [mutie.appsec.study](https://mutie.appsec.study) |

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
| mutie | — |


