# TenantHub 🗂️

A multi-tenant B2B team-workspace app — organizations, members and roles,
projects, tickets, comments, invites, API tokens, billing and a platform admin
console. It behaves like a real SaaS product, with a large surface of ordinary,
correctly-built features across several tenants.

> Deliberately insecure by design. For testing and training. Most of the app is
> hardened on purpose — the interesting bugs are failures of **tenant isolation**
> hidden in the noise.

## Run

```
docker build -t tenanthub vms/tenanthub && docker run --rm -p 8080:80 tenanthub
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours). `demo` belongs to the **Acme** workspace; **Globex** and **Initech**
are other tenants.

## What it exercises

Broken object-level and cross-tenant authorization, a privilege-escalation path
to org admin, insecure import/export (attribute injection), invite handling, plus
classic injection and a server-side template path to code execution. Change the
IDs, watch the org boundaries, and read the request bodies.

_Everything needed is inside the container — the blind-XSS catcher and every
oracle are bundled; no external services or out-of-band infrastructure._
