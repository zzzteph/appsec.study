const express = require('express')
const cors = require('cors')
const path = require('path')
const { generate } = require('./engine')
const { makeAuth } = require('./authmodes')
const { buildRouter } = require('./approuter')
const { mountGraphQL } = require('./graphql')
const { mountTraditional } = require('./traditional')
const internal = require('./internal')

internal.start() // internal-only 127.0.0.1:9000 (reached via an active SSRF block)

// Mutate ONCE at startup, deterministically from a seed (env MUTIE_SEED replays an exact machine).
// Transport axis: MUTIE_API env pins one (rest/graphql/traditional) — otherwise the engine picks
// weighted. Routing per transport:
//   rest        → SPA + REST /api routes
//   graphql     → SPA + REST /api routes + /graphql
//   traditional → server-rendered HTML pages + form POSTs (NO SPA, NO REST vuln routes)
// /api/manifest + /api/seed are ALWAYS served (metadata for discovery/tools). Restart to re-mutate.
const apis = process.env.MUTIE_API ? [process.env.MUTIE_API] : undefined
const mut = generate({ apis, seed: process.env.MUTIE_SEED || undefined })
const auth = makeAuth(mut)
console.log('mutie gen ' + mut.generation + ' seed=' + mut.seed + ' api=' + mut.api + ' auth=' + mut.auth + ' | chain: ' + mut.solutionKind)

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// mount the active transport; each returns the manifest `funcs` (live feature surface)
let funcs
if (mut.api === 'traditional') {
  funcs = mountTraditional(app, mut, auth)
} else {
  const built = buildRouter(mut, auth)
  funcs = built.funcs
  app.use('/api', built.router)
  if (mut.api === 'graphql') mountGraphQL(app, mut, auth)
}

// the seed can be shared to replicate this exact machine
app.get('/api/seed', (q, s) => s.json({ seed: mut.seed, api: mut.api, auth: mut.auth }))

// public manifest: the live feature surface (routes + functional role) — NOT which vulns are on
app.get('/api/manifest', (q, s) => s.json({
  seed: mut.seed, generation: mut.generation, api: mut.api, auth: mut.auth,
  views: mut.views.map(v => ({
    id: v.id, app: v.app, admin: v.admin, kind: v.kind, title: v.title, slug: v.slug, uiVariant: v.uiVariant,
    endpoints: funcs.filter(f => f.block === v.id).map(f => ({ m: f.m, p: f.p, kind: f.kind })),
  })),
}))

// SPA is only served for the api transports that use it; traditional serves its own '/' (server-rendered)
if (mut.api !== 'traditional') {
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('*', (q, s) => s.sendFile(path.join(__dirname, 'public', 'index.html')))
}

app.listen(80, () => console.log('mutie on :80'))
