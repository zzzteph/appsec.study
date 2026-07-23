# Blindspot 🕶️ (Trackr)

A package-tracking portal — track shipments, manage addresses, get delivery
notifications, send feedback, with an admin console for support. It looks like an
ordinary logistics app, but every planted flaw is **blind** (nothing is reflected
— only true/false or timing) or **second-order** (stored safely, used unsafely
later).

> Deliberately insecure by design. For testing and training. Error messages are
> suppressed on purpose — you cannot rely on error/UNION output. Infer, don't read.

## Run

```
docker build -t blindspot vms/blindspot && docker run --rm -p 8080:80 blindspot
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

Boolean- and time-based **blind SQL injection**, **second-order** injection
(input stored on one endpoint, executed on another), **blind command injection**
(no output in the response — find where it lands), and IDOR. Scanners that depend
on reflected errors or echoed payloads will miss these; you have to build an
oracle and infer.

_Everything needed is inside the container — no external services or out-of-band
infrastructure. Timing and stored state are your only signals._
