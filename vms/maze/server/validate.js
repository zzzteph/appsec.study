// Standalone validation of the generation engine (no deps). Proves the guarantee + constraints.
const { generate, PRIMITIVES, findChain } = require('./engine')
const primById = Object.fromEntries(PRIMITIVES.map(p => [p.id, p]))

const N = 50000
let invalid = 0, throwCount = 0
const api = {}, auth = {}, sinks = {}, firsts = {}, kinds = new Set()
let totalActive = 0, totalPlace = 0, sideGens = 0
const uiVar = {}; const distinctViews = new Set(); const fullShapes = new Set()

for (let i = 0; i < N; i++) {
  let g
  try { g = generate() } catch (e) { throwCount++; continue }
  api[g.api] = (api[g.api] || 0) + 1
  auth[g.auth] = (auth[g.auth] || 0) + 1
  kinds.add(g.solutionKind)
  fullShapes.add(g.solution.map(x => x.prim + ':' + x.variant + '@' + x.block).join('->'))
  const first = g.solution[0].prim; firsts[first] = (firsts[first] || 0) + 1
  const sink = g.solution[g.solution.length - 1].prim; sinks[sink] = (sinks[sink] || 0) + 1
  totalActive += g.activeBlocks.length; totalPlace += g.placements.length
  // axis-constraint integrity: no placed primitive may violate the chosen api/auth
  for (const pl of g.placements) { const p = primById[pl.prim]; if ((p.auth && !p.auth.includes(g.auth)) || (p.api && !p.api.includes(g.api))) invalid++ }
  if (g.placements.some(pl => primById[pl.prim].kind === 'side')) sideGens++
  for (const v of g.views) { uiVar[v.uiVariant] = (uiVar[v.uiVariant] || 0) + 1; distinctViews.add(v.id + '#' + v.uiVariant) }
}

console.log('generations                :', N)
console.log('unsolvable (engine threw)  :', throwCount)
console.log('axis-constraint violations :', invalid)
console.log('distinct chain SHAPES (prim)   :', kinds.size)
console.log('distinct chain shapes (prim:variant@block) :', fullShapes.size, '(sampled over ' + N + ' gens — the real space is larger)')
console.log('api-style distribution     :', api)
console.log('auth-style distribution    :', auth)
console.log('first-step (acquire) dist  :', firsts)
console.log('sink (RCE type) dist       :', sinks)
console.log('avg active blocks / gen    :', (totalActive / N).toFixed(1))
console.log('avg vuln placements / gen  :', (totalPlace / N).toFixed(1))
console.log('gens with >=1 side vuln    :', (100 * sideGens / N).toFixed(0) + '%')
console.log('distinct block#uiVariant   :', distinctViews.size, '(block × UI-layout combinations)')
console.log('uiVariant distribution     :', uiVar)

// independent re-validation: rebuild the enabled set and re-run reachability
let recheckFail = 0
for (let i = 0; i < 5000; i++) { const g = generate(); const en = PRIMITIVES.filter(p => g.placements.find(pl => pl.prim === p.id)); if (!findChain(en)) recheckFail++ }
console.log('re-validation unsolvable   :', recheckFail, '/ 5000')

// determinism: the same seed must reproduce an identical machine
let detFail = 0
for (let i = 0; i < 1000; i++) {
  const seed = Math.random().toString(36).slice(2, 10)
  const a = JSON.stringify(generate({ seed })); const b = JSON.stringify(generate({ seed }))
  if (a !== b) detFail++
}
console.log('seed non-reproducible      :', detFail, '/ 1000  (same seed -> identical machine)')

const s = generate()
console.log('\nsample generation: api=' + s.api, 'auth=' + s.auth, 'blocks=' + s.activeBlocks.length, 'placements=' + s.placements.length)
console.log('  guaranteed path :', s.solution.map(x => x.prim + '(' + x.variant + ')@' + x.block).join('  ->  '))
console.log('  sample views    :', s.views.slice(0, 4).map(v => v.title + '[ui' + v.uiVariant + ']').join(', '))
