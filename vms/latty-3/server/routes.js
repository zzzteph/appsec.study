const express = require('express')
const { execSync } = require('child_process')
const { parse } = require('./xml')
const { sign, userFromReq, CONSOLE_USER, CONSOLE_PASS } = require('./auth')

const router = express.Router()

function adminAuth(req, res, next) {
  const u = userFromReq(req)
  if (!u || u.role !== 'admin') return res.status(401).json({ error: 'admin auth required' })
  req.user = u; next()
}

// ---------- public: contact import (XXE) ----------
// Accepts an XML <contact> and echoes the parsed fields. VULN[xxe] via ./xml.js — an external
// entity in <name> is expanded, so file:///app/config/service.conf leaks the backup creds.
router.post('/import', (req, res) => {
  const xml = (req.body && req.body.xml) || ''
  try {
    const doc = parse(xml)
    const pick = (tag) => { const n = doc.get('//' + tag); return n ? n.text() : null }
    res.json({ imported: { name: pick('name'), email: pick('email'), note: pick('note') } })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ---------- admin console ----------
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username !== CONSOLE_USER || password !== CONSOLE_PASS)
    return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(username), user: { username, role: 'admin' } })
})

router.get('/admin/me', adminAuth, (req, res) => res.json(req.user))

// VULN[rce]: the archive name is concatenated straight into a shell command.
//   name = "snap.tgz; id"  ->  tar czf /tmp/snap.tgz /app/config; id
router.post('/admin/backup', adminAuth, (req, res) => {
  const name = (req.body && req.body.name) || 'backup'
  try {
    const out = execSync('tar czf /tmp/' + name + '.tgz /app/config').toString()
    res.json({ ok: true, message: 'Backup written to /tmp/' + name + '.tgz', log: out })
  } catch (e) {
    res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' })
  }
})

module.exports = router
