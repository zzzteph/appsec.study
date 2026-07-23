# Prism 📊

An analytics / BI platform — build queries against your datasets, save charts,
compose dashboards, share them, design report templates and export to CSV. It
looks like an ordinary self-serve BI product, with a large surface of ordinary,
correctly-built features.

> Deliberately insecure by design. For testing and training. The interesting bugs
> are in the query builder, the report templates and the sharing/export paths.

## Run

```
docker build -t prism vms/prism && docker run --rm -p 8080:80 prism
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

SQL injection through a query builder, server-side template injection in the
report builder, dashboard/dataset authorization, CSV/formula injection on export,
plus a privilege-escalation path to an admin console. Feed the filter box, design
a template, and change the IDs.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
