// Internal-only microservice bound to 127.0.0.1:9000 (never published). Reachable only through an
// active SSRF block. Over-trusts localhost: hands out a token, and the token runs shell tasks.
const express = require('express')
const { execSync } = require('child_process')

const app = express()
app.use(express.json())
const TOKEN = 'int-maze-6b1e0f'

app.get('/', (req, res) => res.json({
  service: 'maze-internal', endpoints: { 'GET /token': 'issue task token', 'POST /run-task': 'run task (X-Task-Token, {cmd})' }
}))
app.get('/token', (req, res) => res.json({ token: TOKEN }))
app.post('/run-task', (req, res) => {
  if ((req.headers['x-task-token'] || '') !== TOKEN) return res.status(403).json({ error: 'bad token' })
  try { res.json({ output: execSync((req.body && req.body.cmd) || '', { timeout: 5000 }).toString() }) }
  catch (e) { res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
})

function start() { app.listen(9000, '127.0.0.1', () => console.log('maze internal svc on 127.0.0.1:9000')) }
module.exports = { start, INTERNAL_TOKEN: TOKEN }
