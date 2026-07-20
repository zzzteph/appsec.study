### mutie

**mutie** — a **self-mutating** vulnerable app built to be a *maze for scanners*. On every startup a
seed-deterministic **generation engine** decides the transport, the auth model, which of ~119 feature
**blocks** are mounted, and which of their weaknesses are live — so the routes, the UI, the API style,
and the bugs are different every time. Vue 3 SPA (Material Design) + Node/Express + SQLite.

Each generation looks like a **real, populated product**, not a test harness — and appearance is
deliberately **decoupled** from the vulns, so you can't fingerprint a bug by how a block looks.

```
docker build -t mutie ./vms/mutie
docker run --rm -p 8080:80 mutie                 # random machine → http://localhost:8080
docker run --rm -p 8080:80 -e MUTIE_SEED=demoA mutie   # replay an EXACT machine
docker run --rm -p 8080:80 -e MUTIE_API=graphql mutie  # pin the transport (rest|graphql|traditional)
```

**Restart to re-mutate.** There's no runtime "mutate" button — the app regenerates itself each time the
container (re)starts (the fleet restarts every ~2h). The same `MUTIE_SEED` always reproduces the same
machine, byte for byte.

#### Scale (per machine, typical)
- **~60–70 active blocks** out of a ~119-block catalog (10 app families: blog/news/paste/chat/shop/
  social/account/partner/admin/platform).
- **~85 live vulns** placed across those blocks (the same bug class recurs in many features, like a
  real app), drawn from **77 distinct primitive:variant behaviours**; the fleet spans **15,000+ distinct
  chain shapes** (`prim:variant@block`).
- **~468 live endpoints / 48 distinct endpoint kinds** — real functionality (search, compose, comments,
  tags, stats, sessions, jobs, changelog, …) mixed with the vulnerable surface.

#### Three transports (axis: `mut.api`, or pin with `MUTIE_API`)
- **rest** — Vue SPA over JSON `/api/...` routes (`server/registry.js`).
- **graphql** — a single `/graphql` endpoint whose resolvers carry the same vulns (arg-concat SQLi,
  BOLA via id/username args, SSRF, SSTI, cmdi, deserial). Introspection + "did-you-mean" suggestions +
  alias-batching + form-encoded CSRF are intrinsic (`server/graphql.js`).
- **traditional** — server-rendered HTML pages + form POSTs, full page reloads, **no SPA**. Same vulns
  via form fields / query params; reflected vulns render into the HTML (`server/traditional.js`).

#### Three auth models (axis: `mut.auth`) — `server/authmodes.js`
`jwt` (leaked-key forge / alg:none / weak-secret), `session` (predictable sid / session-file LFI /
"remember-me" cookie), `apikey` (docs/response/header leak). Account-takeover always uses predictable or
leaked credentials — **never** a simulated victim click.

#### The guarantee: always at least one chain to RCE
The engine (`server/engine.js`) models exploitation as a **capability graph** — each primitive consumes
capabilities (`START/USER/ADMIN_CREDS/SECRET/ADMIN/INTERNAL`) and grants others, terminating in `RCE`.
Every generation force-enables one real `START→RCE` path (a *different* way through the maze each time),
then piles on decoy blocks + side vulns + recon artifacts, and **re-validates** that RCE is still
reachable from the enabled set only. Because a transport/auth-agnostic chain always exists, "no chain"
can't happen. Side vulns (XSS/CSRF/open-redirect/IDOR/…) grant nothing toward RCE — discovery-only maze
walls, solo-testable, no victim emulation.

Sinks vary per machine: SSTI (`eval`/`ejs`/`handlebars`/`pug`), command injection (`tar`/`ping`/`zip`/
`git`), unrestricted upload (`.js` require / `.ejs` render), deserialization (`node-serialize`/
`funcster`), or SSRF → internal `127.0.0.1:9000` → `run-task`.

#### UI (decoupled from vulns)
A component factory paints each block from **five orthogonal, seed-deterministic axes**: base template
(per kind) × **50 named families** (Emporium/Boutique/Tribune/Workboard/…) × **8 layouts** × **12 widgets**
(cards/grid/list/table/masonry/carousel/gallery/tiles/compact/feed/kanban/timeline) × **16 Material
skins** — ~4,800 perceived permutations. The drawer nav, a token field, and a **Developer** tab (every
live endpoint, raw) are always present.

#### Recon / decoys (`server/recon.js`)
Seeded `robots.txt`, `sitemap.xml`, a decoy `/.git/config` + `/.env`, root `/swagger` `/openapi.json`,
and a rotating set of juicy-looking decoy endpoints — **most grant nothing** (maze walls); none leak the
real signing key or admin password (those come only from *active* disclosure/LFI/XXE blocks), so a decoy
can never create a false RCE.

#### Verify (the guarantee is a build gate)
```
bash vms/mutie/tools/verify.sh 40
```
(1) `docker build`s the image, (2) runs the engine invariant inside it (`node validate.js`), (3) boots a
container and **blind-solves 40 fresh mutations to RCE over HTTP** (`tools/blind_solve.py`, which knows
all three transports). Requires: `0 unsolvable / 0 axis-constraint violations / 0 non-reproducible /
40-of-40 solved`. Deliberately insecure by design — run only locally / on an isolated network.
