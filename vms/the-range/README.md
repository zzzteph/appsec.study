# The Range 🎯

A calibrated **web-vulnerability scanner benchmark**. Unlike the other machines,
this one is a measurement instrument: a set of planted vulnerabilities — one per
class, at graded difficulty — where each exploit reveals a unique `FLAG{…}`. Feed
the flags your scanner found to the scoring endpoint and get a precise coverage
number you can track over time.

> Deliberately insecure by design. For measuring and training security scanners.

## Run

```
docker build -t the-range vms/the-range && docker run --rm -p 8080:80 the-range
# open http://localhost:8080   (dashboard + scorer)
```

## How to use it

1. `GET /api/challenges` — the map (id, class, difficulty, endpoint, hint). No flags.
2. Run your scanner against the `/api/c/*` endpoints; each successful exploit
   returns that challenge's `FLAG{…}`.
3. `POST /api/score {"flags":[ ... ]}` — returns coverage: overall %, per-class and
   per-difficulty breakdown, and the list of what was missed (with hints).

## Classes covered

SQLi (UNION + blind), IDOR, LFI/traversal, SSTI, command injection, XXE, JWT
`alg:none` bypass, open redirect, reflected XSS, mass assignment, NoSQL injection,
trusted-header auth bypass, info disclosure.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
