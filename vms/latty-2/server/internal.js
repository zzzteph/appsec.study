// Internal "ops" microservice — bound to 127.0.0.1 only, NOT published outside the container.
// It over-trusts the local network: any localhost caller gets a task token, and the token lets
// you run shell tasks. Reachable from the outside ONLY through the public app's SSRF.
const express = require('express')
const { execSync } = require('child_process')

const app = express()
app.use(express.json())

const TOKEN = 'int-ops-7f3a9c21'

app.get('/', (req, res) => res.json({
  service: 'ops-internal',
  version: '1.4.0',
  endpoints: {
    'GET /token': 'issue a task token (localhost is trusted)',
    'POST /run-task': 'run a maintenance task; header X-Admin-Token, body {"cmd":"..."}'
  }
}))

// Hands out the admin token to anyone who can reach it (i.e. localhost / the SSRF).
app.get('/token', (req, res) => res.json({ token: TOKEN, note: 'internal service — trusts the ops network' }))

// VULN[rce]: runs an arbitrary shell command once the (localhost-trusted) token is presented.
app.post('/run-task', (req, res) => {
  if ((req.headers['x-admin-token'] || '') !== TOKEN) return res.status(403).json({ error: 'bad or missing X-Admin-Token' })
  const cmd = (req.body && req.body.cmd) || ''
  try { res.json({ ok: true, output: execSync(cmd, { timeout: 5000 }).toString() }) }
  catch (e) { res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
})

app.listen(9000, '127.0.0.1', () => console.log('internal ops service on 127.0.0.1:9000'))
