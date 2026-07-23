# MobiCare 📶

A mobile-carrier **self-service portal** — sign in with a one-time code, manage
your line, view usage and bills, top up data, change plans, swap your SIM, and
reach support. Behind it is an agent back-office. It behaves like a real telco
self-care app, with a large surface of ordinary, correctly-built features.

> Deliberately insecure by design. For testing and training. Most of the app is
> hardened on purpose — the interesting bugs are in the auth and subscriber-data
> handling.

## Run

```
docker build -t mobicare vms/mobicare && docker run --rm -p 8080:80 mobicare
# open http://localhost:8080   ·   demo / demo   (or number +1-555-0100)
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

One-time-code / phone-based authentication, subscriber-data authorization by
MSISDN, SIM-swap handling, plus classic injection, traversal and template issues
leading to code execution. Watch how the OTP is validated, change the IDs, and
read the request bodies.

_Everything needed is inside the container — the inbox, the blind-XSS catcher and
every oracle are bundled; no external services or out-of-band infrastructure._
