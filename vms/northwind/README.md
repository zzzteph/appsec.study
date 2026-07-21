# Northwind Bank 🏦

A modern online-banking web app — multi-account dashboard, money transfers with
step-up 2FA, statements, saved payees, KYC, support, and a staff back-office. It
behaves like a real neobank, with a large surface of ordinary, correctly-built
features.

> Deliberately insecure by design. For testing and training. Most of the app is
> hardened on purpose — the interesting bugs hide in the money-movement details.

## Run

```
docker build -t northwind vms/northwind && docker run --rm -p 8080:80 northwind
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

Broken object-level authorization on accounts and money movement, a
privilege-escalation path into the staff back-office, a password-reset flow with
an in-app inbox, step-up 2FA, plus classic injection, traversal and template
issues leading to code execution. Don't trust the UI — watch the account IDs and
the request bodies.

_Everything needed is inside the container — the inbox, the blind-XSS catcher and
every oracle are bundled; no external services or out-of-band infrastructure._
