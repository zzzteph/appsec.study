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



