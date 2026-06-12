List of vulnerable machines for testing and training. Nothing more. Nothing less.

Every machine is automatically restarted **every 2 hours** (on even hours, local time).

> Deliberately insecure by design. For authorized testing and training only.

## Machines

| Machine | Vulns | Source | Live |
|---|---|---|---|
| **BoxCutter** | Mixed (easy → blind): injection, XSS, broken access control, API & GraphQL, business logic, info disclosure | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/BoxCutter) | [boxcutter.appsec.study](https://boxcutter.appsec.study) |
| **Stalker** | Leaked Git artifacts · hidden admin panel · SQL injection · code execution | [source](https://github.com/zzzteph/appsec.study/tree/main/vms/Stalker) | [stalker.appsec.study](https://stalker.appsec.study) |

### BoxCutter

A believable Portland e-commerce storefront — **Flask + a built Vue 3 SPA**, a versioned
REST API (OpenAPI/Swagger), a GraphQL endpoint and Spring-style actuators — seeded with a
broad spread of planted bugs. Built to **measure what a scanner finds and what it misses**,
so it ranges from trivially obvious exposures to blind / JS-only / JWT-gated blind spots.

What's inside, by class:

- **Injection** — SQLi (error / boolean-blind / time-blind), NoSQL operator injection, SSTI,
  OS command injection, SSRF, XXE, insecure (pickle) deserialization → RCE, XPath & LDAP.
- **XSS** — reflected, stored, and DOM; attribute / JS-string / `href` contexts; upload-based;
  stored-via-GraphQL-CMS; and a `postMessage` DOM sink.
- **Broken access control** — IDOR and BFLA across the API, mass assignment, vertical/horizontal
  privilege escalation, header- and IP-trust bypasses, and cross-tenant data access.
- **Authentication & identity** — leaked JWT signing secret, `alg:none` forgery, user enumeration,
  host-header / password-reset poisoning, permissive CORS, CSRF.
- **Business logic** — client-controlled prices, negative quantities, uncapped coupons,
  payment-confirmation replay, fee-omission bypasses.
- **Information disclosure** — `/.env`, `/.git/config`, `/config.bak`, `/backup.sql`, Spring
  actuators (`/actuator/env`, `heapdump`, `configprops`), `phpinfo`, and secrets in JS bundles.
- **API & GraphQL** — versioned `v1`/`v2`/`v3` (only `v3` is secure), Swagger-UI DOM XSS,
  GraphQL introspection, SQLi/IDOR resolvers, an unauthenticated `setRole` mutation and a
  secret-leaking field.

Full vulnerability inventory: [vms/BoxCutter/README.md](https://github.com/zzzteph/appsec.study/blob/main/vms/BoxCutter/README.md).

### Stalker

A lean site that looks like nothing much on the surface but leaks its way open. A classic web
chain rather than a scanner playground. What's inside, by class:

- **Information disclosure** — leaked Git artifacts let you recover source and history.
- **Content discovery** — a hidden admin panel that isn't linked from the front page.
- **SQL injection** — injectable queries in the application.
- **Code execution** — the panel runs input it should never trust → RCE.

No full walkthrough here — working the chain is the point. Source is linked above if you want to
read it.
