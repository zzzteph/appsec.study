### mutie

**mutie** — a **self-mutating** vulnerable app. It is assembled from a library of ~38 feature
**blocks** across four archetypes (**admin panel · partner portal · customer shop · social network**).
On every startup a random **mutation** decides which blocks are mounted and which of their weaknesses
are live — so the routes, the features, and the bugs are different each time. Vue 3 SPA (Material
Design) + Node/Express, SQLite.

Each generation is meant to look like a **real, populated product**, not a test harness: a Material UI
with a store (product grid + images + reviews), a social feed (avatars + photos), an admin dashboard
(metric cards + data tables + tools), and a partner portal — all **responsive / mobile-friendly**. Seed
content is faker-generated (names, product titles, posts, prices, ratings), photos come from Lorem
Picsum and avatars are self-contained SVGs. A **Developer** tab still exposes every live endpoint raw.

```
docker build -t mutie ./vms/mutie
docker run --rm -p 8080:80 mutie      # http://localhost:8080
```

**Restart to re-mutate.** There is no runtime "mutate" button — the app regenerates itself each time
the container (re)starts (the fleet restarts every 2 hours, so it re-mutates on that cadence).

#### How it works
- `GET /api/manifest` lists the blocks that are live this generation (their routes) — but **not** which
  vulns are on. You have to probe to find out. The SPA renders every active block as a card you can
  exercise.
- Each block can carry planted vulns (`ctx.on(vuln)` in `server/library.js`): SQLi, LFI, XXE, SSRF,
  SSTI, command injection, unrestricted upload, IDOR/BOLA, mass-assignment, stored XSS, price/logic
  abuse. Only some are enabled per mutation; the rest of the blocks are ordinary functionality / decoys.

#### The guarantee: always at least one chain to RCE
The generator (`server/mutation.js`) always force-enables one full **chain to code execution**, then
adds random decoy blocks/vulns on top. The chain kinds:
- **creds** — SQLi (catalog/people search) or XXE (invoice import) leaks the app admin's cleartext
  password → `POST /api/login` → an admin **sink** (report **SSTI**, backup **command injection**, or
  extension **upload webshell**).
- **forge** — LFI (partner docs, `?file=../secret/app.key`) leaks the **HS256 key** → forge a
  `role:admin` token → an admin sink.
- **ssrf** — the webhook tester reaches an internal-only service on `127.0.0.1:9000` → `run-task`
  command execution.

Verified: the invariant holds over 5000 generations, and a **blind** solver (no inside knowledge)
reaches RCE on every restart. Deliberately insecure by design — run only locally / on an isolated
network.
