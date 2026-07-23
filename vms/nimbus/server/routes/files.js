// Files & shares. Planted: V1 (IDOR any file meta/content), V2 (public-share
// content served without the share password), V3 (a read-only collaborator can
// write — permission not checked), V4 (download path traversal), V5 (XXE import),
// V6 (filename/comment stored XSS), V7 (thumbnail generator shell injection ->
// RCE), V9 (file-search SQLi), V11 (IDOR list any user's files).
const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execSync } = require('child_process')
const router = express.Router()
const { db, requireAuth, user, file } = require('./_util')
const { importXml } = require('../xxe')

router.get('/files', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const own = db.prepare('SELECT id,folder_id,name,mime,size,is_folder,created FROM files WHERE owner_id = ?').all(u.id)
  const shared = db.prepare(`SELECT f.id,f.name,f.mime,f.size,f.is_folder,s.permission FROM files f JOIN shares s ON s.file_id=f.id WHERE s.shared_with_user_id = ?`).all(u.id)
  res.json({ files: own, shared })
})
// V1 — IDOR: any file's metadata / content, no ownership or share check.
router.get('/files/:id', (req, res) => { const u = requireAuth(req, res); if (!u) return; const f = file(req.params.id); if (!f) return res.status(404).json({ error: 'not found' }); res.json(f) })
router.get('/files/:id/content', (req, res) => { const u = requireAuth(req, res); if (!u) return; const f = file(req.params.id); if (!f) return res.status(404).json({ error: 'not found' }); res.json({ id: f.id, name: f.name, content: f.content }) })

// V3 — a read-only collaborator can still write: only presence of a share (or
// ownership) is checked, not its permission.
router.patch('/files/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const f = file(req.params.id); if (!f) return res.status(404).json({ error: 'not found' })
  const share = db.prepare('SELECT * FROM shares WHERE file_id = ? AND shared_with_user_id = ?').get(f.id, u.id)
  if (f.owner_id !== u.id && !share) return res.status(403).json({ error: 'no access' })
  db.prepare('UPDATE files SET content = ? WHERE id = ?').run(String((req.body || {}).content || ''), f.id)  // permission never checked
  res.json({ ok: true, id: f.id })
})

// Upload (filename stored raw -> V6 stored XSS in the file list / admin).
router.post('/files', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const b = req.body || {}
  const id = db.prepare("INSERT INTO files(owner_id,folder_id,name,mime,size,content,is_folder,created) VALUES (?,?,?,?,?,?,0,datetime('now'))")
    .run(u.id, Number(b.folder_id) || 0, String(b.name || 'untitled').slice(0, 120), String(b.mime || 'text/plain'), (String(b.content || '').length / 1024), String(b.content || '')).lastInsertRowid
  res.json({ ok: true, id })
})

// ---- shares ------------------------------------------------------------------
router.post('/files/:id/share', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const f = file(req.params.id); if (!f || f.owner_id !== u.id) return res.status(403).json({ error: 'not your file' })
  const token = crypto.randomBytes(8).toString('hex')
  db.prepare("INSERT INTO shares(file_id,owner_id,token,password,permission,shared_with_user_id,expires,created) VALUES (?,?,?,?,?,?,?,datetime('now'))")
    .run(f.id, u.id, token, (req.body || {}).password || null, (req.body || {}).permission || 'read', (req.body || {}).user_id || null, null)
  res.json({ ok: true, token })
})
router.get('/shares/:token', (req, res) => {
  const s = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token)
  if (!s) return res.status(404).json({ error: 'invalid share' })
  const f = file(s.file_id)
  res.json({ file: { id: f.id, name: f.name, mime: f.mime, size: f.size }, has_password: !!s.password })
})
// Intended flow: unlock with the password to read content.
router.post('/shares/:token/unlock', (req, res) => {
  const s = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token)
  if (!s) return res.status(404).json({ error: 'invalid share' })
  if (s.password && (req.body || {}).password !== s.password) return res.status(403).json({ error: 'wrong password' })
  res.json({ content: file(s.file_id).content })
})
// V2 — content endpoint serves the file regardless of the share password.
router.get('/shares/:token/content', (req, res) => {
  const s = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token)
  if (!s) return res.status(404).json({ error: 'invalid share' })
  res.json({ name: file(s.file_id).name, content: file(s.file_id).content })
})

// V11 — IDOR: list any user's files.
router.get('/users/:id/files', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,name,mime,size,created FROM files WHERE owner_id = ?').all(req.params.id))
})

// V9 — file-search SQLi.
router.get('/files-search', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, name, mime, size FROM files WHERE name LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// V5 — XML import with external entities enabled (XXE -> local file read).
router.post('/import', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const xml = typeof req.body === 'string' ? req.body : (req.body || {}).xml
  if (!xml) return res.status(400).json({ error: 'xml required' })
  try { res.json({ ok: true, imported: importXml(String(xml)) }) } catch (e) { res.status(400).json({ error: 'import failed', detail: e.message }) }
})

// V7 — thumbnail/preview generator shells out with the requested size -> command
// injection -> RCE.
router.post('/files/:id/thumbnail', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const f = file(req.params.id); if (!f) return res.status(404).json({ error: 'not found' })
  const size = String((req.body || {}).size || '128')
  let out
  try { out = execSync('echo generating thumbnail ' + size + ' for "' + f.name + '"', { encoding: 'utf8' }) }
  catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  res.json({ ok: true, output: String(out).trim() })
})

// V4 — download reads from the storage dir without traversal protection.
const STORAGE = path.join(__dirname, '..', 'storage')
router.get('/download', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = req.query.path; if (!p) return res.json({ available: fs.readdirSync(STORAGE) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(STORAGE, p), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

// ---- comments (V6 stored XSS) ------------------------------------------------
router.get('/files/:id/comments', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT id,author_name,body,created FROM comments WHERE file_id = ? ORDER BY id').all(req.params.id)) })
router.post('/files/:id/comments', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const me = user(u.id)
  const id = db.prepare("INSERT INTO comments(file_id,author_id,author_name,body,created) VALUES (?,?,?,?,datetime('now'))").run(req.params.id, u.id, me.name, String((req.body || {}).body || '').slice(0, 1000)).lastInsertRowid
  res.json({ ok: true, id })
})

module.exports = router
