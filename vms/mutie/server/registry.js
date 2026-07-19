// Block registry: mounts real REST routes for each active block, honoring the engine's vuln
// placements (which primitive+variant is live in that block). Reuses the proven vuln logic from the
// latty machines. Blocks are grouped into KINDS; each kind implements a coherent feature + its vulns.
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const ejs = require('ejs')
const serialize = require('node-serialize')
const { db } = require('./db')
const { parseXXE } = require('./xml')
const { CONF_PATH, KEY_PATH, ADMIN_USER } = require('./secrets')
const { esc, isPrivate, evalRender } = require('./vulns')

const DOCS_DIR = path.join(__dirname, 'docs')
const EXT_DIR = path.join(__dirname, 'ext')

const KIND = {
  blog: 'content', news: 'content', pastebin: 'content', 'shop-catalog': 'content', 'social-people': 'content',
  'partner-invoice': 'import', invoices: 'import',
  'partner-docs': 'fileportal', 'menu-editor': 'fileportal',
  'partner-webhook': 'webhook', offers: 'webhook',
  'api-docs': 'disclosure',
  'user-panel': 'account', 'profile-editor': 'account',
  'admin-reports': 'adminreport', 'admin-templates': 'adminreport', 'news-admin': 'adminreport',
  'admin-backup': 'adminbackup', 'admin-jobs': 'adminbackup',
  'admin-extensions': 'adminupload',
}

// mount every active block; returns manifest funcs [{block, m, p, kind}]
function mountAll(router, mut, auth) {
  const funcs = []
  const stores = {}
  const store = (k) => (stores[k] || (stores[k] = []))
  const requireAdmin = (req, res, next) => { const u = auth.resolve(req); if (!u) return res.status(401).json({ error: 'auth required' }); if (u.role !== 'admin') return res.status(403).json({ error: 'admin only' }); req.user = u; next() }
  const requireAuth = (req, res, next) => { const u = auth.resolve(req); if (!u) return res.status(401).json({ error: 'auth required' }); req.user = u; next() }

  for (const view of mut.views) {
    const kind = view.kind || KIND[view.id] || 'feature'
    const base = '/' + view.slug
    const placed = mut.placements.filter(p => p.block === view.id)
    const on = (prim) => placed.some(p => p.prim === prim)
    const variant = (prim) => { const p = placed.find(p => p.prim === prim); return p ? p.variant : null }
    const add = (m, p, k) => funcs.push({ block: view.id, m, p, kind: k })
    const ctx = { router, base, on, variant, add, requireAdmin, requireAuth, store, view, __issue: (res, user) => auth.issue(res, user), __adminKey: () => auth.ADMIN_KEYFN() }
    ;(MOUNT[kind] || MOUNT.feature)(ctx)
  }
  return funcs
}

const MOUNT = {
  // -------- content: searchable list (SQLi) + composer (stored XSS) --------
  content(x) {
    const { router, base, on, add } = x
    router.get(base + '/items', (q, s) => s.json(db.prepare('SELECT id,name,category,price,rating FROM products LIMIT 30').all()))
    add('GET', base + '/items', 'list')
    router.get(base + '/search', (q, s) => {
      const term = q.query.q || ''
      try {
        if (on('sqli')) return s.json(db.prepare("SELECT id,name,category FROM products WHERE name LIKE '%" + term + "%'").all()) // UNION-injectable (3 cols)
        s.json(db.prepare('SELECT id,name,category FROM products WHERE name LIKE ?').all('%' + term + '%'))
      } catch (e) { s.status(500).json({ error: e.message }) }
    })
    add('GET', base + '/search', 'search')
    const posts = x.store(x.view.id)
    router.get(base + '/posts', (q, s) => s.json(posts))
    router.post(base + '/posts', (q, s) => { const { title, body } = q.body || {}; posts.push({ id: posts.length + 1, title: on('side-xss-stored') ? title : esc(title), body: on('side-xss-stored') ? body : esc(body) }); s.json({ ok: true }) })
    add('GET', base + '/posts', 'list'); add('POST', base + '/posts', 'compose')
  },

  // -------- import: XXE --------
  import(x) {
    const { router, base, on, add } = x
    router.post(base + '/import', (q, s) => {
      const xml = (q.body && q.body.xml) || ''
      try { const doc = on('xxe') ? parseXXE(xml) : require('libxmljs2').parseXml(xml, { noent: false }); const pick = (t) => { const n = doc.get('//' + t); return n ? n.text() : null }; s.json({ imported: { ref: pick('ref'), customer: pick('customer'), amount: pick('amount') } }) }
      catch (e) { s.status(400).json({ error: e.message }) }
    })
    add('POST', base + '/import', 'import')
  },

  // -------- fileportal: LFI read + (admin) upload webshell --------
  fileportal(x) {
    const { router, base, on, variant, add, requireAdmin } = x
    router.get(base + '/file', (q, s) => {
      const name = q.query.name || 'welcome.txt'
      try { if (on('lfi')) return s.type('text/plain').send(fs.readFileSync(path.join(DOCS_DIR, name), 'utf8')); if (!/^[\w.-]+$/.test(name)) return s.status(400).json({ error: 'bad name' }); s.type('text/plain').send(fs.readFileSync(path.join(DOCS_DIR, path.basename(name)), 'utf8')) }
      catch (e) { s.status(404).json({ error: 'not found' }) }
    })
    add('GET', base + '/file', 'read')
    mountUpload(x, requireAdmin)
  },

  // -------- webhook: SSRF --------
  webhook(x) {
    const { router, base, on, add } = x
    router.post(base + '/fetch', async (q, s) => {
      const { url, method = 'GET', headers = {}, body } = q.body || {}
      if (!url) return s.status(400).json({ error: 'url required' })
      if (!on('ssrf') && isPrivate(url)) return s.status(400).json({ error: 'destination not allowed' })
      try { const r = await fetch(url, { method, headers: headers && typeof headers === 'object' ? headers : {}, body: body !== undefined && method !== 'GET' && method !== 'HEAD' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined }); const t = await r.text(); const h = {}; r.headers.forEach((v, k) => { h[k] = v }); s.json({ status: r.status, headers: h, body: t }) }
      catch (e) { s.status(502).json({ error: e.message }) }
    })
    add('POST', base + '/fetch', 'fetch')
  },

  // -------- disclosure: source/config/key + admin apikey leak --------
  disclosure(x) {
    const { router, base, on, add, view } = x
    router.get(base + '/openapi.json', (q, s) => {
      const spec = { openapi: '3.0.0', info: { title: 'mutie API', version: '1.0' }, paths: {} }
      if (on('disclosure-source')) spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
      if (on('apikey-leak')) spec['x-admin-key'] = x.__adminKey()
      s.json(spec)
    })
    add('GET', base + '/openapi.json', 'docs')
    router.get(base + '/backup', (q, s) => { if (on('disclosure-source')) return s.type('text/plain').send(fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim()); s.status(404).json({ error: 'not found' }) })
    add('GET', base + '/backup', 'backup-file')
  },

  // -------- account: register(mass-assign) / login(sqli) / reset(weak) / profile / deserial --------
  account(x) {
    const { router, base, on, variant, add, requireAuth, requireAdmin } = x
    router.post(base + '/register', (q, s) => {
      const { username, password, role } = q.body || {}
      if (!username || !password) return s.status(400).json({ error: 'username/password required' })
      if (db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) return s.status(409).json({ error: 'taken' })
      const r = on('side-massassign') && role ? role : 'user'   // mass-assignment: attacker sets own role
      db.prepare('INSERT INTO users(username,password,role,email,apikey) VALUES (?,?,?,?,?)').run(username, password, r, username + '@mutie.local', 'ak_live_' + Math.random().toString(16).slice(2, 10))
      s.json({ ok: true, role: r })
    })
    add('POST', base + '/register', 'register')
    router.post(base + '/login', (q, s) => {
      const { username, password } = q.body || {}
      let user
      if (on('login-bypass')) { try { user = db.prepare("SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'").get() } catch (e) { } } // SQLi auth bypass
      else user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password)
      if (!user) return s.status(401).json({ error: 'invalid credentials' })
      s.json(Object.assign({ user: { username: user.username, role: user.role } }, auth_issue(x, s, user)))
    })
    add('POST', base + '/login', 'login')
    router.post(base + '/reset', (q, s) => {
      const { username } = q.body || {}
      if (!on('reset-weak')) return s.json({ ok: true, message: 'if the account exists, an email was sent' })
      const token = 'rt-' + username                              // predictable token
      if (variant('reset-weak') === 'leaked-in-response') return s.json({ ok: true, token })
      s.json({ ok: true, message: 'reset email sent' })
    })
    add('POST', base + '/reset', 'reset')
    router.post(base + '/reset/confirm', (q, s) => {
      const { username, token, password } = q.body || {}
      if (!on('reset-weak') || token !== 'rt-' + username) return s.status(400).json({ error: 'invalid token' })
      db.prepare('UPDATE users SET password=? WHERE username=?').run(password, username); s.json({ ok: true })
    })
    add('POST', base + '/reset/confirm', 'reset-confirm')
    router.patch(base + '/profile', requireAuth, (q, s) => {
      const allow = on('side-massassign') ? ['email', 'bio', 'role', 'password'] : ['email', 'bio']
      for (const k of allow) if (k in (q.body || {})) db.prepare('UPDATE users SET ' + k + '=? WHERE username=?').run(q.body[k], q.user.username)
      s.json(db.prepare('SELECT username,role,email FROM users WHERE username=?').get(q.user.username))
    })
    add('PATCH', base + '/profile', 'profile')
    // user directory lookup — BOLA: any logged-in user can read ANY user's full record (creds/key)
    router.get(base + '/users/:username', requireAuth, (q, s) => {
      const u = db.prepare('SELECT username,role,email,password,apikey FROM users WHERE username=?').get(q.params.username)
      if (!u) return s.status(404).json({ error: 'not found' })
      s.json(on('bola-read') ? u : { username: u.username, role: u.role, email: u.email })
    })
    add('GET', base + '/users/:username', 'user-lookup')
    if (on('sink-deserial')) mountDeserial(x, requireAdmin)
  },

  // -------- admin report generator: SSTI --------
  adminreport(x) {
    const { router, base, on, variant, add, requireAdmin } = x
    router.post(base + '/render', requireAdmin, (q, s) => {
      const { template, data } = q.body || {}
      if (!on('sink-ssti')) return s.json({ output: String(template == null ? '' : template).replace(/\{\{([\s\S]+?)\}\}/g, (_, k) => esc((data || {})[k.trim()])) })
      try { const out = variant('sink-ssti') === 'ejs' ? ejs.render(String(template || ''), data && typeof data === 'object' ? data : {}) : evalRender(template, data && typeof data === 'object' ? data : {}); s.json({ output: out }) }
      catch (e) { s.status(400).json({ error: e.message }) }
    })
    add('POST', base + '/render', 'render')
  },

  // -------- admin backup/jobs: command injection (+ deserial on jobs) --------
  adminbackup(x) {
    const { router, base, on, add, requireAdmin } = x
    router.post(base + '/backup', requireAdmin, (q, s) => {
      const name = (q.body && q.body.name) || 'backup'
      try { if (on('sink-cmdi')) { const out = execSync('tar czf /tmp/' + name + '.tgz /app/config').toString(); return s.json({ ok: true, log: out }) } execSync('tar czf /tmp/' + String(name).replace(/[^\w.-]/g, '_') + '.tgz /app/config'); s.json({ ok: true }) }
      catch (e) { s.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
    })
    add('POST', base + '/backup', 'backup')
    if (on('sink-deserial')) mountDeserial(x, x.requireAdmin)
  },

  // -------- admin extensions: upload webshell --------
  adminupload(x) { mountUpload(x, x.requireAdmin) },

  // -------- feature/decoy: benign list + optional side vulns (idor/price/open-redirect) --------
  feature(x) {
    const { router, base, on, add, requireAuth } = x
    const items = x.store(x.view.id)
    if (!items.length) for (let i = 1; i <= 6; i++) items.push({ id: i, owner: i % 2 ? 'alice' : 'bob', title: x.view.title + ' #' + i, secret: 'note-' + i })
    router.get(base + '/list', (q, s) => s.json(items.map(i => ({ id: i.id, title: i.title }))))
    add('GET', base + '/list', 'list')
    router.get(base + '/item/:id', on('side-idor') ? (q, s, n) => n() : requireAuth, (q, s) => { const it = items.find(i => i.id === Number(q.params.id)); it ? s.json(it) : s.status(404).json({ error: 'not found' }) })
    add('GET', base + '/item/:id', 'detail')
    if (on('side-open-redirect')) { router.get(base + '/go', (q, s) => s.redirect(String(q.query.url || '/'))); add('GET', base + '/go', 'redirect') }
    if (on('side-price')) { router.post(base + '/checkout', (q, s) => { const items = (q.body && q.body.items) || []; let t = 0; for (const it of items) t += (Number(it.price) || 0) * (Number(it.qty) || 1); s.json({ total: Math.round(t * 100) / 100 }) }); add('POST', base + '/checkout', 'checkout') }
  },
}

// ---- helpers shared by kinds ----
function auth_issue(x, res, user) { return x.__issue(res, user) }
function mountUpload(x, requireAdmin) {
  const { router, base, on, variant, add } = x
  router.post(base + '/ext', requireAdmin, (q, s) => {
    const { filename, content } = q.body || {}
    if (!filename) return s.status(400).json({ error: 'filename required' })
    if (!on('sink-upload') && !/\.(txt|md)$/.test(filename)) return s.status(400).json({ error: 'only .txt/.md' })
    fs.mkdirSync(EXT_DIR, { recursive: true }); fs.writeFileSync(path.join(EXT_DIR, filename), content == null ? '' : String(content)); s.json({ ok: true, saved: filename })
  })
  add('POST', base + '/ext', 'upload')
  router.post(base + '/ext/:name/run', requireAdmin, (q, s) => {
    if (!on('sink-upload')) return s.status(403).json({ error: 'execution disabled' })
    try {
      const full = path.join(EXT_DIR, q.params.name)
      if (variant('sink-upload') === 'ejs-template') return s.json({ output: ejs.render(fs.readFileSync(full, 'utf8'), {}) })
      const f = require.resolve(full); delete require.cache[f]; const m = require(f); const fn = typeof m === 'function' ? m : (m && m.run); s.json({ output: String(fn ? fn() : m) })
    } catch (e) { s.status(500).json({ error: e.message }) }
  })
  add('POST', base + '/ext/:name/run', 'run')
}
function mountDeserial(x, requireAdmin) {
  const { router, base, add } = x
  router.post(base + '/import-job', requireAdmin, (q, s) => {
    try { const o = serialize.unserialize((q.body && q.body.job) || '{}'); s.json({ ok: true, result: String(o && o.name || 'job loaded') }) }
    catch (e) { s.status(500).json({ error: e.message }) }
  })
  add('POST', base + '/import-job', 'import-job')
}

module.exports = { mountAll, KIND }
