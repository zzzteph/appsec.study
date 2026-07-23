# MongoLeak (Notely) 🍃

A MERN-style notes app — sign in, create notes, mark them private, search with
MongoDB-style filters, with an admin console. It behaves like an ordinary
Mongo-backed web app.

> Deliberately insecure by design. For testing and training. The interesting bugs
> are NoSQL injection — the query semantics are exactly MongoDB's, so real Mongo
> payloads work verbatim.

## Run

```
docker build -t mongoleak vms/mongoleak && docker run --rm -p 8080:80 mongoleak
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt on every start (live instance restarts every 2 hours).

## What it exercises

NoSQL (MongoDB) injection: operator injection for authentication bypass
(`{"$gt":""}`, `{"$ne":null}`), `$where` server-side JavaScript injection leading
to code execution, blind extraction via `$regex`, plus IDOR and mass assignment.
Send objects where the app expects strings.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
