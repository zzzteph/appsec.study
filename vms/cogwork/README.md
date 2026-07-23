# Cogwork ⚙️

A workflow-automation platform — build workflows, run them on a schedule, import
and export workflow definitions, manage settings, with an admin console. It
behaves like an ordinary automation SaaS.

> Deliberately insecure by design. For testing and training. The interesting bugs
> are in how it deserializes imports and merges settings.

## Run

```
docker build -t cogwork vms/cogwork && docker run --rm -p 8080:80 cogwork
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt on every start (live instance restarts every 2 hours).

## What it exercises

Insecure deserialization (Node object deserialization leading to code execution),
prototype pollution (an unsafe recursive merge leading to authorization bypass),
plus IDOR, injection and a couple of the usual authorization slips. Think about
what a "workflow export" really contains, and what your preferences JSON can reach.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
