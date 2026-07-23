# FrontDesk

A boutique hotel-booking site served through **FrontDesk Edge**, a small caching reverse proxy that sits in front of the origin application. Vue 3 SPA + Express origin, fronted by a custom edge on port 80.

## Run

```bash
docker build -t frontdesk .
docker run --rm -p 8080:80 frontdesk
# open http://localhost:8080
```

## Demo account

| Username | Password    | Tier   |
|----------|-------------|--------|
| `demo`   | `demo`      | Silver |
| `alice`  | `alicehotel`| Gold   |
| `bob`    | `bobhotel`  | Silver |

## Features

- Browse and search rooms & suites, read guest reviews, make reservations.
- Loyalty tiers, per-guest account area with trip history.
- Password-reset flow, support contact.
- Everything is delivered through **FrontDesk Edge**: responses carry an `X-Cache` header (`HIT`/`MISS`), static assets are cached, and an edge policy restricts administrative paths.

## Architecture

```
client ──► FrontDesk Edge (:80, caching + policy) ──► origin app (127.0.0.1:3000)
```

The edge and the origin are two different HTTP implementations with two different views of each request — which is the whole point of the exercise.

## Notes

Security training target with deliberately planted vulnerabilities — the interesting ones live at the **boundary between the edge and the origin**. Run locally in a disposable container only. Data is in-memory and resets on restart.
