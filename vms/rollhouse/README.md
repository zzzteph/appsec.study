# RollHouse 🎰

An online-casino web app — slots, Crash, roulette, blackjack, a live wallet, VIP
tiers, promotions, referrals, a community feed and a staff back-office. It looks
and behaves like a real iGaming platform, with a large surface of ordinary,
correctly-built features.

> Deliberately insecure by design. For testing and training. Most of the app is
> hardened on purpose — the interesting bugs are hidden in the noise.

## Run

```
docker build -t rollhouse .
docker run --rm -p 8080:80 rollhouse
# open http://localhost:8080
```

The world is rebuilt from a fixed seed on every start (and the live instance
restarts every 2 hours), so it always returns to a known state.

## Getting started

- Demo account: **`demo`** / **`demo`**
- Or register your own — you'll get a welcome bonus.

## What it exercises

Business-logic abuse, broken object-level authorization (IDOR/BOLA), a
privilege-escalation path into a staff console, injection, client-side sinks, a
weak "provably fair" scheme, and a couple of routes all the way to code
execution. No two findings use the same trick, and plenty of endpoints are there
purely as decoys. Fingerprint the surface, don't trust the UI, and read the
JavaScript.

_Everything needed to solve the machine is inside the container — no external
services, callbacks, or out-of-band infrastructure._
