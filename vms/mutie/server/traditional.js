// Traditional transport — server-rendered HTML pages + form POSTs (full page reloads, NO SPA).
// Mounted when mut.api === 'traditional'. Every block gets a page at /b/<slug> whose forms submit
// (GET query / POST x-www-form-urlencoded) to /b/<slug>/<op>. The handlers carry the SAME vulns as the
// REST registry (arg-concat SQLi, XXE, LFI, disclosure, SSRF, login/reset/mass-assign, SSTI, cmdi,
// upload, deserial) and reflect the result back into the HTML. Each response also embeds the raw result
// as a JSON blob (<script type="application/json" id="mj">) so reflected vulns render in-page AND a
// blind solver can parse deterministically. Auth is resolved through the same authmodes.resolve(req),
// so JWT/session/apikey weaknesses (forge/alg-none/weak/predict/remember-me/apikey-leak) all transfer.
const express = require('express')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const ejs = require('ejs')
const serialize = require('node-serialize')
const { db } = require('./db')
const { parseXXE } = require('./xml')
const { CONF_PATH, KEY_PATH, ADMIN_USER } = require('./secrets')
const { esc, isPrivate, evalRender, tripleBraceRender, pugSSTIRender } = require('./vulns')

const DOCS_DIR = path.join(__dirname, 'docs')
const EXT_DIR = path.join(__dirname, 'ext')

// which op routes each kind exposes — kind labels mirror the REST manifest so recon/tools line up
const KIND_OPS = {
  content: [['GET', 'items', 'list'], ['GET', 'search', 'search'], ['GET', 'posts', 'list'], ['POST', 'posts', 'compose'], ['GET', 'comments', 'comments']],
  import: [['POST', 'import', 'import']],
  fileportal: [['GET', 'file', 'read'], ['POST', 'ext', 'upload'], ['POST', 'ext-run', 'run']],
  webhook: [['POST', 'fetch', 'fetch']],
  disclosure: [['GET', 'openapi', 'docs'], ['GET', 'backup', 'backup-file'], ['GET', 'leak', 'leak']],
  account: [['POST', 'register', 'register'], ['POST', 'login', 'login'], ['POST', 'reset', 'reset'], ['POST', 'reset-confirm', 'reset-confirm'], ['POST', 'profile', 'profile'], ['GET', 'user-lookup', 'user-lookup'], ['POST', 'import-job', 'import-job'], ['POST', 'login-as', 'login-as'], ['POST', 'profile-write', 'profile-write']],
  adminreport: [['POST', 'render', 'render']],
  adminbackup: [['POST', 'backup', 'backup'], ['POST', 'import-job', 'import-job']],
  adminupload: [['POST', 'ext', 'upload'], ['POST', 'ext-run', 'run']],
  feature: [['GET', 'list', 'list'], ['GET', 'item', 'detail']],
}

// ---- HTML shell (server-rendered, lightly Material) ----
function shell(mut, title, body) {
  const nav = mut.views.slice(0, 40).map(v => `<a href="/b/${v.slug}">${esc(v.title)}</a>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · mutie</title><style>
:root{--p:#3f51b5}*{box-sizing:border-box}body{margin:0;font-family:Roboto,Segoe UI,system-ui,Arial,sans-serif;background:#f4f5f7;color:#212121}
header{background:var(--p);color:#fff;padding:.7rem 1rem;font-size:1.2rem;font-weight:500;position:sticky;top:0}
.wrap{display:flex;gap:1rem;padding:1rem;max-width:1200px;margin:0 auto}
nav{width:230px;flex:0 0 230px;background:#fff;border-radius:8px;padding:.5rem;height:max-content;box-shadow:0 1px 3px rgba(0,0,0,.12)}
nav a{display:block;padding:.4rem .6rem;color:#212121;text-decoration:none;font-size:.85rem;border-radius:4px}
nav a:hover{background:#eef0fb}
main{flex:1;min-width:0}
.card{background:#fff;border-radius:8px;padding:1rem 1.2rem;box-shadow:0 1px 3px rgba(0,0,0,.12);margin-bottom:1rem}
h1{font-size:1.4rem;color:#303f9f;margin:.2rem 0 1rem}
label{display:block;font-size:.78rem;color:#6b7280;margin-top:.5rem}
input,textarea,select{width:100%;padding:.5rem;border:1px solid #cfd4dc;border-radius:6px;font:inherit;background:#fafbfc}
button{background:var(--p);color:#fff;border:0;border-radius:4px;padding:.5rem 1rem;font:inherit;font-weight:500;text-transform:uppercase;cursor:pointer;margin-top:.5rem}
pre.out{background:#263238;color:#eceff1;padding:.7rem;border-radius:6px;overflow-x:auto;font-size:.78rem}
.chip{display:inline-block;padding:.1rem .5rem;border-radius:999px;background:#e8eaf6;color:#3949ab;font-size:.72rem}
table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #eee;padding:.4rem;text-align:left;font-size:.85rem}
</style></head><body><header>◐ mutie <span class="chip" style="background:rgba(255,255,255,.2);color:#fff">traditional · ${esc(mut.auth)}</span></header>
<div class="wrap"><nav>${nav}</nav><main>${body}</main></div></body></html>`
}

// embed the raw result so reflected vulns render in-page AND the solver can parse it deterministically
function blob(obj) { return `<script type="application/json" id="mj">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>` }
function outPre(obj) { return `<pre class="out">${esc(JSON.stringify(obj, null, 2))}</pre>` }

function form(action, method, fields, submit) {
  const inputs = fields.map(f => f.type === 'textarea'
    ? `<label>${f.label}</label><textarea name="${f.name}" rows="3">${esc(f.value || '')}</textarea>`
    : `<label>${f.label}</label><input name="${f.name}" value="${esc(f.value || '')}" />`).join('')
  return `<form action="${action}" method="${method}">${inputs}<button type="submit">${submit || 'Submit'}</button></form>`
}

// render a block's page: a form per op the kind supports
function blockPage(mut, view) {
  const kind = view.kind
  const ops = KIND_OPS[kind] || KIND_OPS.feature
  const base = '/b/' + view.slug
  let cards = `<h1>${esc(view.title)} <span class="chip">${esc(kind)}</span></h1>`
  for (const [m, op, label] of ops) {
    const action = base + '/' + op
    let fields = []
    if (op === 'search') fields = [{ name: 'q', label: 'Search' }]
    else if (op === 'file') fields = [{ name: 'name', label: 'File name', value: 'welcome.txt' }]
    else if (op === 'import') fields = [{ name: 'xml', label: 'Invoice XML', type: 'textarea', value: '<invoice><ref>A1</ref></invoice>' }]
    else if (op === 'posts') fields = m === 'POST' ? [{ name: 'title', label: 'Title' }, { name: 'body', label: 'Body', type: 'textarea' }] : []
    else if (op === 'register') fields = [{ name: 'username', label: 'Username' }, { name: 'password', label: 'Password' }, { name: 'role', label: 'Role (optional)' }]
    else if (op === 'login') fields = [{ name: 'username', label: 'Username' }, { name: 'password', label: 'Password' }, { name: 'remember', label: 'Remember (1/0)' }]
    else if (op === 'reset') fields = [{ name: 'username', label: 'Username', value: 'root_admin' }]
    else if (op === 'reset-confirm') fields = [{ name: 'username', label: 'Username', value: 'root_admin' }, { name: 'token', label: 'Token' }, { name: 'password', label: 'New password' }]
    else if (op === 'profile') fields = [{ name: 'email', label: 'Email' }, { name: 'bio', label: 'Bio' }, { name: 'role', label: 'Role' }]
    else if (op === 'user-lookup') fields = [{ name: 'username', label: 'Username', value: 'root_admin' }]
    else if (op === 'login-as') fields = [{ name: 'username', label: 'Username', value: 'root_admin' }]
    else if (op === 'profile-write') fields = [{ name: 'username', label: 'Username', value: 'root_admin' }, { name: 'password', label: 'New password' }]
    else if (op === 'render') fields = [{ name: 'template', label: 'Template', type: 'textarea' }, { name: 'data', label: 'Data (JSON)', value: '{}' }]
    else if (op === 'backup') fields = [{ name: 'name', label: 'Name' }, { name: 'host', label: 'Host' }, { name: 'branch', label: 'Branch' }]
    else if (op === 'import-job') fields = [{ name: 'job', label: 'Job (JSON)', type: 'textarea', value: '{}' }]
    else if (op === 'ext') fields = [{ name: 'filename', label: 'Filename' }, { name: 'content', label: 'Content', type: 'textarea' }]
    else if (op === 'ext-run') fields = [{ name: 'name', label: 'Extension name' }]
    else if (op === 'fetch') fields = [{ name: 'url', label: 'URL', value: 'https://example.com/' }, { name: 'method', label: 'Method', value: 'GET' }, { name: 'headers', label: 'Headers (JSON)', value: '{}' }, { name: 'body', label: 'Body' }]
    cards += `<div class="card"><b>${esc(op)}</b> <span class="chip">${esc(m)}</span>${form(action, m.toLowerCase(), fields, op)}</div>`
  }
  return shell(mut, view.title, cards)
}

// ---- op handlers (same vulns as registry) ----
function mountTraditional(app, mut, auth) {
  const byId = Object.fromEntries(mut.views.map(v => [v.id, v]))
  const bySlug = Object.fromEntries(mut.views.map(v => [v.slug, v]))
  const placementsByBlock = {}
  for (const p of mut.placements) (placementsByBlock[p.block] = placementsByBlock[p.block] || []).push(p)
  const stores = {}
  const store = (k) => (stores[k] || (stores[k] = []))
  const funcs = []
  for (const v of mut.views) for (const [m, op, kind] of (KIND_OPS[v.kind] || KIND_OPS.feature)) funcs.push({ block: v.id, m, p: '/b/' + v.slug + '/' + op, kind })

  // global express.json() (index.js) handles JSON bodies; forms need urlencoded on top
  const parse = express.urlencoded({ extended: true, limit: '1mb' })

  app.get('/', (q, s) => s.type('html').send(shell(mut, 'Home',
    '<h1>Directory</h1><div class="card">' + mut.views.map(v => `<a href="/b/${v.slug}">${esc(v.title)}</a> <span class="chip">${esc(v.kind)}</span><br>`).join('') + '</div>')))
  app.get('/b/:slug', (q, s) => { const v = bySlug[q.params.slug]; if (!v) return s.status(404).type('html').send(shell(mut, '404', '<h1>Not found</h1>')); s.type('html').send(blockPage(mut, v)) })

  const page = (res, mut, view, title, resultObj, extraHtml) => res.type('html').send(shell(mut, title,
    `<h1>${esc(view ? view.title : title)}</h1>${extraHtml || ''}<div class="card"><b>Result</b>${outPre(resultObj)}${blob(resultObj)}</div>` +
    (view ? `<div class="card"><a href="/b/${view.slug}">← back to ${esc(view.title)}</a></div>` : '')))

  app.all('/b/:slug/:op', parse, async (req, res) => {
    const view = bySlug[req.params.slug]
    if (!view) return res.status(404).type('html').send(shell(mut, '404', '<h1>Not found</h1>'))
    const placed = placementsByBlock[view.id] || []
    const on = (prim) => placed.some(p => p.prim === prim)
    const variant = (prim) => { const p = placed.find(p => p.prim === prim); return p ? p.variant : null }
    const body = req.body || {}
    const q = req.query || {}
    const val = (k) => (body[k] !== undefined ? body[k] : q[k])
    const needAuth = () => { const u = auth.resolve(req); return u }
    const needAdmin = () => { const u = auth.resolve(req); return u && u.role === 'admin' ? u : null }
    const op = req.params.op

    try {
      // -------- content --------
      if (op === 'items') return page(res, mut, view, 'Items', db.prepare('SELECT id,name,category,price,rating FROM products LIMIT 30').all())
      if (op === 'search') {
        const term = val('q') || ''
        const v = on('sqli') ? (variant('sqli') || 'union') : null
        if (!on('sqli')) return page(res, mut, view, 'Search', db.prepare('SELECT id,name,category FROM products WHERE name LIKE ?').all('%' + term + '%'))
        const sql = "SELECT id,name,category FROM products WHERE name LIKE '%" + term + "%'"
        if (v === 'blind-time' && /'/.test(term)) { try { db.prepare("SELECT randomblob(20000000) WHERE (" + term.replace(/^%'|--\s*$/g, '') + ")").all() } catch {} }
        let rows
        try { rows = db.prepare(sql).all() }
        catch (e) { if (v === 'error') return page(res, mut, view, 'Search', { error: e.message, query: sql }); return page(res, mut, view, 'Search', { error: e.message }) }
        if (v === 'blind-bool') return page(res, mut, view, 'Search', { found: rows.length })
        return page(res, mut, view, 'Search', rows)
      }
      if (op === 'posts') {
        const posts = store(view.id + ':posts')
        if (req.method === 'GET') return page(res, mut, view, 'Posts', posts)
        const p = { id: posts.length + 1, title: on('side-xss-stored') ? val('title') : esc(val('title')), body: on('side-xss-stored') ? val('body') : esc(val('body')) }
        posts.push(p)
        // stored-xss reflects unescaped into the friendly HTML view
        return page(res, mut, view, 'Posts', { ok: true, post: p }, `<div class="card"><b>${p.title || ''}</b><div>${p.body || ''}</div></div>`)
      }
      if (op === 'comments') return page(res, mut, view, 'Comments', store(view.id + ':comments'))
      if (op === 'list') { const items = seedItems(store, view); return page(res, mut, view, 'List', items.map(i => ({ id: i.id, title: i.title }))) }
      if (op === 'item') { const items = seedItems(store, view); const it = items.find(i => i.id === Number(val('id'))); return page(res, mut, view, 'Item', it || { error: 'not found' }) }

      // -------- import (XXE) --------
      if (op === 'import') {
        const xml = val('xml') || ''
        const doc = on('xxe') ? parseXXE(xml) : require('libxmljs2').parseXml(xml, { noent: false })
        const pick = (t) => { const n = doc.get('//' + t); return n ? n.text() : null }
        return page(res, mut, view, 'Import', { imported: { ref: pick('ref'), customer: pick('customer'), amount: pick('amount') } })
      }

      // -------- fileportal (LFI) + upload --------
      if (op === 'file') {
        const nameRaw = val('name') || 'welcome.txt'; const v = variant('lfi') || 'traversal'
        if (on('lfi')) {
          let target
          if (v === 'absolute' && /^\//.test(nameRaw)) target = nameRaw
          else if (v === 'null-byte') target = path.join(DOCS_DIR, String(nameRaw).split('\0')[0])
          else target = path.join(DOCS_DIR, nameRaw)
          return page(res, mut, view, 'File', { name: nameRaw, content: fs.readFileSync(target, 'utf8') })
        }
        if (!/^[\w.-]+$/.test(nameRaw)) return page(res, mut, view, 'File', { error: 'bad name' })
        return page(res, mut, view, 'File', { name: nameRaw, content: fs.readFileSync(path.join(DOCS_DIR, path.basename(nameRaw)), 'utf8') })
      }
      if (op === 'ext') {
        if (!needAdmin()) return res.status(403).type('html').send(shell(mut, 'Forbidden', '<h1>admin only</h1>' + blob({ error: 'admin only' })))
        const filename = val('filename'); const content = val('content')
        if (!filename) return page(res, mut, view, 'Upload', { error: 'filename required' })
        if (!on('sink-upload') && !/\.(txt|md)$/.test(filename)) return page(res, mut, view, 'Upload', { error: 'only .txt/.md' })
        fs.mkdirSync(EXT_DIR, { recursive: true }); fs.writeFileSync(path.join(EXT_DIR, filename), content == null ? '' : String(content))
        return page(res, mut, view, 'Upload', { ok: true, saved: filename })
      }
      if (op === 'ext-run') {
        if (!needAdmin()) return res.status(403).type('html').send(shell(mut, 'Forbidden', '<h1>admin only</h1>' + blob({ error: 'admin only' })))
        if (!on('sink-upload')) return page(res, mut, view, 'Run', { error: 'execution disabled' })
        const full = path.join(EXT_DIR, val('name'))
        if (variant('sink-upload') === 'ejs-template') return page(res, mut, view, 'Run', { output: ejs.render(fs.readFileSync(full, 'utf8'), {}) })
        const f = require.resolve(full); delete require.cache[f]; const mod = require(f); const fn = typeof mod === 'function' ? mod : (mod && mod.run)
        return page(res, mut, view, 'Run', { output: String(fn ? fn() : mod) })
      }

      // -------- disclosure --------
      if (op === 'openapi') {
        const spec = { openapi: '3.0.0', info: { title: 'mutie API', version: '1.0' }, paths: {} }
        const v = variant('disclosure-source') || 'swagger-example'
        if (on('disclosure-source') && v === 'swagger-example') {
          spec.paths = { '/login': { post: { requestBody: { content: { 'application/json': { example: { username: ADMIN_USER, password: (fs.readFileSync(CONF_PATH, 'utf8').match(/admin\.password=(\S+)/) || [, ''])[1] } } } } } } }
          spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
        } else if (on('disclosure-source')) spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
        if (on('apikey-leak')) spec['x-admin-key'] = auth.ADMIN_KEYFN()
        return page(res, mut, view, 'OpenAPI', spec)
      }
      if (op === 'backup') {
        if (!on('disclosure-source')) return page(res, mut, view, 'Backup', { error: 'not found' })
        return page(res, mut, view, 'Backup', { text: fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim() })
      }
      if (op === 'leak') {
        if (!on('disclosure-source')) return page(res, mut, view, 'Leak', { error: 'not found' })
        return page(res, mut, view, 'Leak', { text: fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim() })
      }

      // -------- account --------
      if (op === 'register') {
        const username = val('username'); const password = val('password'); const role = val('role')
        if (!username || !password) return page(res, mut, view, 'Register', { error: 'username/password required' })
        if (db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) return page(res, mut, view, 'Register', { error: 'taken' })
        const r = on('side-massassign') && role ? role : 'user'
        db.prepare('INSERT INTO users(username,password,role,email,apikey) VALUES (?,?,?,?,?)').run(username, password, r, username + '@mutie.local', 'ak_live_' + Math.random().toString(16).slice(2, 10))
        return page(res, mut, view, 'Register', { ok: true, role: r })
      }
      if (op === 'login') {
        const username = val('username'); const password = val('password'); const remember = val('remember')
        let user
        if (on('login-bypass')) { try { user = db.prepare("SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'").get() } catch {} }
        else user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password)
        const exists = db.prepare('SELECT 1 FROM users WHERE username=?').get(username)
        if (on('side-user-enum') && !user) {
          const v = variant('side-user-enum') || 'message'
          if (v === 'timing' && !exists) { const t = Date.now() + 200; while (Date.now() < t) {} }
          if (v === 'message') return page(res, mut, view, 'Login', { error: exists ? 'invalid password' : 'unknown user' })
        }
        if (!user) return page(res, mut, view, 'Login', { error: 'invalid credentials' })
        const issued = auth.issue(res, user)
        if (on('remember-me') && remember) {
          const v = variant('remember-me') || 'base64-username'
          const rv = v === 'base64-username' ? Buffer.from(user.username).toString('base64') : user.username
          const prev = res.getHeader('Set-Cookie') || ''
          res.setHeader('Set-Cookie', [].concat(prev, 'mutie_remember=' + rv + '; Path=/; HttpOnly'))
        }
        return page(res, mut, view, 'Login', Object.assign({ user: { username: user.username, role: user.role } }, issued))
      }
      if (op === 'reset') {
        const username = val('username')
        if (!on('reset-weak')) return page(res, mut, view, 'Reset', { ok: true, message: 'if the account exists, an email was sent' })
        const token = 'rt-' + username
        if (variant('reset-weak') === 'leaked-in-response') return page(res, mut, view, 'Reset', { ok: true, token })
        return page(res, mut, view, 'Reset', { ok: true, message: 'reset email sent' })
      }
      if (op === 'reset-confirm') {
        const username = val('username'); const token = val('token'); const password = val('password')
        if (!on('reset-weak') || token !== 'rt-' + username) return page(res, mut, view, 'Reset', { error: 'invalid token' })
        db.prepare('UPDATE users SET password=? WHERE username=?').run(password, username)
        return page(res, mut, view, 'Reset', { ok: true })
      }
      if (op === 'profile') {
        const u = needAuth(); if (!u) return res.status(401).type('html').send(shell(mut, 'Auth', '<h1>auth required</h1>' + blob({ error: 'auth required' })))
        const allow = on('side-massassign') ? ['email', 'bio', 'role', 'password'] : ['email', 'bio']
        for (const k of allow) if (val(k) != null && val(k) !== '') db.prepare('UPDATE users SET ' + k + '=? WHERE username=?').run(val(k), u.username)
        return page(res, mut, view, 'Profile', db.prepare('SELECT username,role,email FROM users WHERE username=?').get(u.username))
      }
      if (op === 'user-lookup') {
        const u = needAuth(); if (!u) return res.status(401).type('html').send(shell(mut, 'Auth', '<h1>auth required</h1>' + blob({ error: 'auth required' })))
        const rec = db.prepare('SELECT username,role,email,password,apikey FROM users WHERE username=?').get(val('username'))
        if (!rec) return page(res, mut, view, 'Lookup', { error: 'not found' })
        return page(res, mut, view, 'Lookup', on('bola-read') ? rec : { username: rec.username, role: rec.role, email: rec.email })
      }
      if (op === 'login-as') {
        if (!on('login-as')) return page(res, mut, view, 'Login as', { error: 'not found' })
        const user = db.prepare('SELECT * FROM users WHERE username=?').get(val('username') || ADMIN_USER)
        if (!user) return page(res, mut, view, 'Login as', { error: 'no such user' })
        const issued = auth.issue(res, user)
        return page(res, mut, view, 'Login as', Object.assign({ user: { username: user.username, role: user.role } }, issued))
      }
      if (op === 'profile-write') {
        const u = needAuth(); if (!u) return res.status(401).type('html').send(shell(mut, 'Auth', '<h1>auth required</h1>' + blob({ error: 'auth required' })))
        if (!on('bola-write')) return page(res, mut, view, 'Profile write', { error: 'forbidden' })
        const un = val('username')
        if (un && val('password') != null) db.prepare('UPDATE users SET password=? WHERE username=?').run(val('password'), un)
        return page(res, mut, view, 'Profile write', { ok: true, updated: un })
      }

      // -------- sinks --------
      if (op === 'render') {
        if (!needAdmin()) return res.status(403).type('html').send(shell(mut, 'Forbidden', '<h1>admin only</h1>' + blob({ error: 'admin only' })))
        const template = val('template'); let data = val('data')
        try { data = data && typeof data === 'string' ? JSON.parse(data) : (data || {}) } catch { data = {} }
        if (!on('sink-ssti')) return page(res, mut, view, 'Render', { output: String(template == null ? '' : template).replace(/\{\{([\s\S]+?)\}\}/g, (_, k) => esc(data[k.trim()])) })
        const v = variant('sink-ssti') || 'eval'
        let out
        if (v === 'ejs') out = ejs.render(String(template || ''), data)
        else if (v === 'handlebars') out = tripleBraceRender(template, data)
        else if (v === 'pug') out = pugSSTIRender(template, data)
        else out = evalRender(template, data)
        return page(res, mut, view, 'Render', { output: out })
      }
      if (op === 'backup') {
        if (!needAdmin()) return res.status(403).type('html').send(shell(mut, 'Forbidden', '<h1>admin only</h1>' + blob({ error: 'admin only' })))
        const v = on('sink-cmdi') ? (variant('sink-cmdi') || 'tar') : null
        if (v === 'ping') return page(res, mut, view, 'Backup', { ok: true, log: execSync('ping -c 1 ' + (val('host') || 'localhost')).toString() })
        if (v === 'zip') return page(res, mut, view, 'Backup', { ok: true, log: execSync('zip -q /tmp/' + (val('name') || 'backup') + '.zip /app/config/app.conf').toString() })
        if (v === 'git') return page(res, mut, view, 'Backup', { ok: true, log: execSync('git log --oneline -1 ' + (val('branch') || 'main') + ' 2>&1 || echo done').toString() })
        if (v === 'tar') return page(res, mut, view, 'Backup', { ok: true, log: execSync('tar czf /tmp/' + (val('name') || 'backup') + '.tgz /app/config').toString() })
        const sn = String(val('name') || 'backup').replace(/[^\w.-]/g, '_'); execSync('tar czf /tmp/' + sn + '.tgz /app/config')
        return page(res, mut, view, 'Backup', { ok: true, log: '' })
      }
      if (op === 'import-job') {
        if (!needAdmin()) return res.status(403).type('html').send(shell(mut, 'Forbidden', '<h1>admin only</h1>' + blob({ error: 'admin only' })))
        const raw = val('job') || '{}'; const v = variant('sink-deserial') || 'node-serialize'
        let o
        if (v === 'funcster') { const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; o = parsed && parsed.__js_function ? { name: String(new Function('return (' + parsed.__js_function + ')()')()) } : parsed }
        else o = serialize.unserialize(typeof raw === 'string' ? raw : JSON.stringify(raw))
        return page(res, mut, view, 'Import job', { ok: true, result: String((o && o.name) || 'job loaded') })
      }

      // -------- webhook (SSRF) --------
      if (op === 'fetch') {
        const url = val('url'); const method = val('method') || 'GET'
        let headers = val('headers'); let fbody = val('body')
        try { headers = headers && typeof headers === 'string' ? JSON.parse(headers) : (headers || {}) } catch { headers = {} }
        if (!url) return page(res, mut, view, 'Fetch', { error: 'url required' })
        if (on('ssrf-cloudmeta')) {
          const meta = variant('ssrf-cloudmeta') || 'aws-imds'; const key = fs.readFileSync(KEY_PATH, 'utf8').trim()
          if (meta === 'aws-imds' && /169\.254\.169\.254\/latest\/meta-data\/iam\/security-credentials/i.test(url))
            return page(res, mut, view, 'Fetch', { status: 200, headers: {}, body: JSON.stringify({ AccessKeyId: 'ASIA' + key.slice(0, 12), SecretAccessKey: key }) })
          if (meta === 'gcp-metadata' && /metadata\.google\.internal\/computeMetadata\/v1\/instance\/service-accounts/i.test(url))
            return page(res, mut, view, 'Fetch', { status: 200, headers: {}, body: JSON.stringify({ access_token: key, expires_in: 3600 }) })
        }
        if (!on('ssrf') && isPrivate(url)) return page(res, mut, view, 'Fetch', { error: 'destination not allowed' })
        const opts = { method, headers: typeof headers === 'object' ? headers : {}, body: fbody !== undefined && fbody !== '' && method !== 'GET' && method !== 'HEAD' ? (typeof fbody === 'string' ? fbody : JSON.stringify(fbody)) : undefined }
        if (on('ssrf') && (variant('ssrf') || 'full') === 'redirect') opts.redirect = 'follow'
        const r = await fetch(url, opts); const t = await r.text(); const h = {}; r.headers.forEach((v, k) => { h[k] = v })
        return page(res, mut, view, 'Fetch', { status: r.status, headers: h, body: t })
      }

      return res.status(404).type('html').send(shell(mut, '404', '<h1>no such op</h1>' + blob({ error: 'no such op' })))
    } catch (e) {
      return res.status(500).type('html').send(shell(mut, 'Error', '<h1>error</h1>' + outPre({ error: e.message }) + blob({ error: e.message })))
    }
  })

  return funcs
}

function seedItems(store, view) {
  const items = store(view.id + ':items')
  if (!items.length) for (let i = 1; i <= 6; i++) items.push({ id: i, owner: i % 2 ? 'alice' : 'bob', title: (view.title || 'Item') + ' #' + i, secret: 'note-' + i })
  return items
}

module.exports = { mountTraditional }
