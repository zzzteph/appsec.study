// Benchmark scoring. GET /api/challenges lists the map (no flags). POST /api/score
// takes the flags a scanner/tester collected and returns a coverage report.
const express = require('express')
const router = express.Router()
const { FLAGS } = require('./flags')

const ids = Object.keys(FLAGS).map(Number)
const total = ids.length

router.get('/challenges', (req, res) => {
  res.json(ids.map(id => ({ id, class: FLAGS[id].class, difficulty: FLAGS[id].difficulty, endpoint: FLAGS[id].endpoint, hint: FLAGS[id].hint })))
})

router.post('/score', (req, res) => {
  const submitted = new Set((Array.isArray((req.body || {}).flags) ? req.body.flags : []).map(s => String(s).trim()))
  const flagToId = Object.fromEntries(ids.map(id => [FLAGS[id].flag, id]))
  const found = [], missed = []
  for (const id of ids) {
    const hit = submitted.has(FLAGS[id].flag)
    ;(hit ? found : missed).push({ id, class: FLAGS[id].class, difficulty: FLAGS[id].difficulty, ...(hit ? {} : { endpoint: FLAGS[id].endpoint, hint: FLAGS[id].hint }) })
  }
  const invalid = [...submitted].filter(f => !(f in flagToId))
  const by = (keyFn) => { const o = {}; for (const id of ids) { const k = keyFn(id); o[k] = o[k] || { found: 0, total: 0 }; o[k].total++; if (submitted.has(FLAGS[id].flag)) o[k].found++ } return o }
  res.json({
    score: found.length, total, coverage_pct: Math.round((found.length / total) * 100),
    by_class: by(id => FLAGS[id].class), by_difficulty: by(id => FLAGS[id].difficulty),
    found, missed, invalid_flags: invalid,
  })
})
module.exports = router
