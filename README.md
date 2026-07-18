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


