// Projects / tickets / import / automation. Planted: V1 (cross-tenant IDOR on
// projects, tickets, attachments), V2 (project import mass-assigns org_id/owner_id/
// automation_template with no membership check -> cross-tenant write + ownership
// hijack), V6 (ticket-search SQLi), V7 (comment stored/blind XSS), V8 (automation
// template preview SSTI -> RCE), V9 (export download path traversal).
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db, requireAuth, project, ticket, canAdminProject } = require('./_util')
const { render } = require('../templates')

router.get('/projects', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare(`SELECT p.* FROM projects p JOIN memberships m ON m.org_id=p.org_id WHERE m.user_id=?`).all(u.id))
})
// V1 — IDOR: any project (incl. confidential ones + automation_template).
router.get('/projects/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = project(req.params.id); if (!p) return res.status(404).json({ error: 'not found' })
  res.json(p)
})
router.get('/projects/:id/tickets', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,title,status,priority,created FROM tickets WHERE project_id = ? ORDER BY id').all(req.params.id))
})
// V6 — ticket search SQLi (declared before /tickets/:id so it isn't shadowed).
router.get('/tickets/search', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, title, body, status, priority FROM tickets WHERE title LIKE '%${q}%' OR body LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) }
  catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// V1 — IDOR: any ticket.
router.get('/tickets/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const t = ticket(req.params.id); if (!t) return res.status(404).json({ error: 'not found' })
  res.json(t)
})
router.get('/tickets/:id/comments', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,author_name,body,created FROM comments WHERE ticket_id = ? ORDER BY id').all(req.params.id))
})
// V7 — comment body stored raw (rendered unsanitised in the board -> stored/blind XSS).
router.post('/tickets/:id/comments', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const t = ticket(req.params.id); if (!t) return res.status(404).json({ error: 'not found' })
  const me = db.prepare('SELECT name FROM users WHERE id=?').get(u.id)
  const id = db.prepare("INSERT INTO comments(ticket_id,org_id,author_id,author_name,body,created) VALUES (?,?,?,?,?, datetime('now'))")
    .run(t.id, t.org_id, u.id, me.name, String((req.body || {}).body || '').slice(0, 2000)).lastInsertRowid
  res.json({ ok: true, id })
})

// V2 — project import: mass-assigns org_id, owner_id and automation_template from
// the blob with no check the caller belongs to that org -> create a project in
// another tenant, owned by you, with an arbitrary automation template.
router.post('/projects/import', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const b = req.body || {}
  const p = b.project || b
  const id = db.prepare(`INSERT INTO projects(org_id,name,description,owner_id,automation_template,created)
    VALUES (?,?,?,?,?, datetime('now'))`).run(
    Number(p.org_id != null ? p.org_id : b.org_id) || 0,
    String(p.name || 'Imported project'), String(p.description || ''),
    Number(p.owner_id != null ? p.owner_id : u.id),
    String(p.automation_template || 'Ticket {{ title }} updated.')
  ).lastInsertRowid
  res.json({ ok: true, project_id: id, org_id: db.prepare('SELECT org_id FROM projects WHERE id=?').get(id).org_id })
})

// V8 — automation template preview renders server-side (Nunjucks) -> SSTI RCE.
// Gated to the project owner OR an org admin/owner (reachable via V2/V3/V4).
router.post('/projects/:id/automation/preview', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = project(req.params.id); if (!p) return res.status(404).json({ error: 'not found' })
  if (!canAdminProject(u, p)) return res.status(403).json({ error: 'project admin required' })
  const tpl = (req.body || {}).template != null ? String(req.body.template) : p.automation_template
  const ctx = (req.body || {}).sample || { title: 'Sample ticket', status: 'open', assignee: 'demo' }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) }
  catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})

// ---- attachments / export ----------------------------------------------------
// V1 — IDOR: any attachment's metadata.
router.get('/attachments/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const a = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id)
  if (!a) return res.status(404).json({ error: 'not found' })
  res.json(a)
})
// V9 — export download joins the path without traversal protection.
const EXPORTS = path.join(__dirname, '..', 'exports')
router.get('/export/download', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const file = req.query.file
  if (!file) return res.json({ available: fs.readdirSync(EXPORTS) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(EXPORTS, file), 'utf8')) }
  catch (e) { res.status(404).json({ error: 'file not found', detail: e.message }) }
})

module.exports = router
