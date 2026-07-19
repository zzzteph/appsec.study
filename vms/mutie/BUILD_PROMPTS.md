# mutie — overnight autonomous build plan

Feed these prompts to Claude Code (one phase at a time is safest; or paste the whole file and say
"work through the phases in order, committing after each"). Designed to run unattended
(`--dangerously-skip-permissions`). Every phase has a **verification gate** — do not proceed to the
next phase until the current one's checks pass.

Working dir: `vms/mutie`. The app mutates once at startup (seed-deterministic). Restart to re-mutate.

---

## STANDING RULES (apply to EVERY phase — re-read before each)

1. **Never break the guarantee. The Docker build is a MANDATORY part of every gate.** After any change,
   run the single gate command from `vms/mutie`:
   ```
   bash tools/verify.sh 40
   ```
   It (1) **`docker build`s the image** (must succeed cleanly), (2) runs the engine invariant INSIDE the
   image (`docker run --rm mutie node validate.js`), (3) boots a container and blind-solves 40 fresh
   mutations. **Require:** `unsolvable 0`, `axis-constraint violations 0`, `re-validation unsolvable 0`,
   `seed non-reproducible 0`, and **40/40 solved**.
   If <40, a generation is unsolvable OR a vuln/handler is broken — reproduce the failing seed:
   `docker run -d --name mu -e MUTIE_SEED=<seed> -p 8092:80 mutie`, inspect the intended path via
   `docker exec mu node -e "console.log(require('./engine').generate({apis:['rest'],seed:'<seed>'}).solution)"`,
   fix the **app** (never weaken the solver), and re-run the gate.
   (On Windows/Git-Bash prefix docker volume commands with `MSYS_NO_PATHCONV=1`; `verify.sh` avoids
   volume mounts on purpose so it is cross-platform.)
2. **Seed determinism is sacred.** All randomness in the engine flows through `server/rng.js` (RNG).
   Never call `Math.random()` inside `engine.js` generation. New content generators must also be seeded
   if they affect the machine's exploitable state.
3. **No emulated victim users.** Every vuln must be solo-testable by the tester. XSS/CSRF/open-redirect
   are discovery-only "side" primitives (grant nothing toward RCE). Account takeover uses predictable/
   leaked tokens, never a victim click.
4. **UI is decoupled from vulns.** Appearance (name/slug/uiVariant/widget) must never reveal which vuln
   (if any) a block holds. Same Material color scheme across all variants.
5. **Extend the blind solver** (`tools/blind_solve.py`) whenever you add a new acquisition/auth/sink
   primitive or a new transport, so the 40/40 gate actually exercises it.
6. **Commit after each phase** on a feature branch: `git add -A && git commit`. Update
   `README.md`/memory if user-facing behavior changes.

Architecture recap: `engine.js` (capability-graph generator, procedural, 15k+ chain shapes) →
`authmodes.js` (jwt/session/apikey) → `approuter.js`+`registry.js` (mounts active blocks by `kind`,
honoring `mut.placements`) → `index.js` (`/api/manifest`, `/api/seed`, `MUTIE_SEED`). Blocks have a
`kind` in `engine.js` `BLOCKS`; primitive host-lists derive from kind via `ofKind()`.

---

## PHASE 1 — Component-factory frontend (100+ realistic, responsive views)

**Goal.** Replace the current (broken) SPA so each active block renders as a realistic Material view.
The new `/api/manifest` shape is `{ seed, api, auth, views:[{id,app,kind,title,slug,uiVariant,endpoints:[{m,p,kind}]}] }`.

Build in `web/src`:
- `lib/store.js` — fetch `/api/manifest`; expose `views`, `token`, and `get/post` helpers (prefix `/api`).
- `lib/img.js` — keep Lorem-Picsum photos + SVG initial-avatars (already present).
- A **component factory**: ~8 base templates (`ListView, DetailView, ComposerView, DashboardView,
  TableView, FormView, EditorView, GalleryView`) each supporting **5 layout variants** (driven by
  `view.uiVariant`) AND a **widget dimension** (carousel / map / grid / list / table / cards / masonry).
  Pick template+widget from `view.kind` + `uiVariant` deterministically. Same indigo Material palette.
- A shell `App.vue`: top app-bar, responsive drawer nav grouped by `app`, renders the chosen view
  component per active block. Keep a "Developer" tab listing every endpoint (raw), and a token field.
- Each view calls its block's real endpoints (from `view.endpoints`) so it's populated with content.

**Acceptance / verify.**
- `docker build -t mutie .` succeeds; open `http://localhost:8092` → renders many varied blocks, no
  console errors; mobile viewport is usable (responsive).
- Re-run the STANDING RULES gate (engine invariant + 40/40 blind). Frontend changes must not affect it.
- Visually confirm two different seeds (`-e MUTIE_SEED=a` vs `=b`) look like different apps.

---

## PHASE 2 — Incorporate ALL fleet vuln classes + real per-variant implementations

**Goal.** Grow the primitive catalog to cover vulns from every existing machine (boxcutter, nomnom,
graph, shoppy, DVWA, juicy, stalker, latty-1..5, ghost, refreshy) and make each **variant genuinely
distinct** (not cosmetic).

- In `engine.js` add primitives (with axis constraints + weights) and, where useful, intermediate
  capabilities for deeper chains. Candidates: SSRF→cloud-metadata, prototype-pollution→RCE sink,
  insecure-deserial (real `funcster` variant), SSTI real engines (`handlebars`, `pug` — add deps),
  blind-SQLi (time/boolean actually blind in `registry.js`), 2nd-order SQLi, path-traversal upload,
  ZipSlip, CSV-injection (side), SSRF gopher (side), NoSQL (only if a Mongo-like store is added),
  access-control matrix (side: `X-Original-URL`, method-override, trailing-slash, referer-gate),
  auth flaws (username-enum timing side, weak "remember-me" cookie → ADMIN), mass-assignment credit,
  GraphQL-only ones are added in Phase 3.
- In `registry.js` implement each new primitive/variant for real in its `kind` handler. Every
  solution-capable primitive MUST have a working route in ALL of its host blocks.
- Add variants so `sink-ssti` truly renders per engine, `sink-cmdi` per tool, `sqli` per technique.

**Acceptance / verify.** STANDING RULES gate. Then confirm variety grew:
`docker run --rm -v "$PWD/server":/s node:20-slim node /s/validate.js` → `distinct chain shapes
(prim:variant@block)` should increase materially (target: keep climbing). Extend `tools/blind_solve.py`
to exploit every new acquisition/auth/sink primitive, and keep **40/40**.

---

## PHASE 3 — GraphQL transport

**Goal.** When `mut.api === 'graphql'`, expose a single `/graphql` endpoint whose schema is assembled
from the active blocks; resolvers carry the same vulns (SQLi in args, BOLA via id args, etc.).

- Add `server/graphql.js`: build schema + resolvers from `mut.views`/placements. Support (as engine
  side-primitives already model) introspection on/off, error-message **suggestions**, **alias-batching**,
  GraphQL-CSRF (accepts form-encoded).
- `index.js`: if api==='graphql', mount `/graphql` instead of the REST routes (or in addition, with the
  manifest advertising graphql). `engine.generate` already picks api; stop forcing `apis:['rest']` in
  `index.js` once graphql (and later traditional) are implemented — or gate via `MUTIE_API` env.
- Extend `tools/blind_solve.py` with a GraphQL path (introspect or suggestion-recover the schema, then
  run the chain through resolvers).

**Acceptance / verify.** STANDING RULES gate, plus run the app with a graphql seed and confirm the blind
solver reaches RCE via `/graphql`. Keep REST 40/40 intact.

---

## PHASE 4 — Traditional (server-rendered, page-reload) transport

**Goal.** When `mut.api === 'traditional'`, serve **server-rendered HTML pages + form POSTs** (full page
reloads, no SPA). Same vulns via form fields / query params / hidden inputs.

- Add `server/traditional.js`: EJS-rendered pages per active block; forms post to the same logical
  endpoints; sinks/acquisition reachable via form/query. Reflected vulns render into the HTML.
- `index.js`: route by `mut.api`.
- Extend the blind solver with an HTML/form path.

**Acceptance / verify.** STANDING RULES gate + a traditional-seed blind solve reaching RCE.

---

## PHASE 5 — Recon / disclosure surface + decoys (deepen the maze)

- Real recon artifacts (seeded, some pointing at live vulns, most decoys): `robots.txt`, `sitemap.xml`,
  exposed `.git/config`, editor backups (`*.bak`, `*~`), sourcemaps, `/swagger`/`/openapi.json`.
- Many **decoy endpoints** that look vulnerable but aren't; consistent 404/500 behavior so scanners
  can't trivially diff. Route/param renaming already partly done (slug) — extend param renaming.

**Acceptance / verify.** STANDING RULES gate. Confirm decoys don't create false RCE and the guarantee
still holds.

---

## FINAL

- Update `vms/mutie/README.md` to describe the procedural engine, transports, auth models, seed replay.
- **Clean Docker build from scratch must pass** (run from `vms/mutie`): `docker build --no-cache -t mutie .`,
  then a final full gate `bash tools/verify.sh 40` (40/40). Confirm the fleet publish workflow
  (`.github/workflows/vms-publish.yml`) still discovers `vms/mutie/Dockerfile`.
- Leave the branch ready for review; summarize what changed per phase in the PR body.
