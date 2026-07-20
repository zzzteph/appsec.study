// Block registry: mounts real REST routes for each active block, honoring the engine's vuln
// placements (which primitive+variant is live in that block). Reuses the proven vuln logic from the
// latty machines. Blocks are grouped into KINDS; each kind implements a coherent feature + its vulns.
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const ejs = require('ejs')
const pug = require('pug')
const serialize = require('node-serialize')
const { db } = require('./db')
const { parseXXE } = require('./xml')
const { CONF_PATH, KEY_PATH, ADMIN_USER } = require('./secrets')
const { esc, isPrivate, evalRender, tripleBraceRender, pugSSTIRender } = require('./vulns')

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
    mountExtras(ctx, kind)
    mountSide(ctx)
  }
  return funcs
}

const MOUNT = {
  // -------- content: searchable list (SQLi in multiple flavors) + composer (stored XSS) --------
  content(x) {
    const { router, base, on, variant, add } = x
    router.get(base + '/items', (q, s) => s.json(db.prepare('SELECT id,name,category,price,rating FROM products LIMIT 30').all()))
    add('GET', base + '/items', 'list')
    // /search — variant-distinct behaviors: union / error / blind-bool / blind-time
    router.get(base + '/search', (q, s) => {
      const term = q.query.q || ''
      const v = on('sqli') ? (variant('sqli') || 'union') : null
      try {
        if (!on('sqli')) return s.json(db.prepare('SELECT id,name,category FROM products WHERE name LIKE ?').all('%' + term + '%'))
        const sql = "SELECT id,name,category FROM products WHERE name LIKE '%" + term + "%'"
        if (v === 'blind-time' && /'/.test(term)) {
          // simulate a slow-path when injection is present — solver can measure to extract
          try { db.prepare("SELECT randomblob(20000000) WHERE (" + term.replace(/^%'|--\s*$/g, '') + ")").all() } catch {}
        }
        const rows = db.prepare(sql).all()
        if (v === 'blind-bool') {
          // On blind-bool, we hide names/categories but still expose a count that reflects the query result.
          return s.json({ found: rows.length })
        }
        s.json(rows)
      } catch (e) {
        // error variant — dump the raw SQL that failed (leaks the injection form back for extraction)
        if (v === 'error') return s.status(500).json({ error: e.message, query: "SELECT id,name,category FROM products WHERE name LIKE '%" + term + "%'" })
        s.status(500).json({ error: e.message })
      }
    })
    add('GET', base + '/search', 'search')
    const posts = x.store(x.view.id)
    router.get(base + '/posts', (q, s) => s.json(posts))
    router.post(base + '/posts', (q, s) => { const { title, body } = q.body || {}; posts.push({ id: posts.length + 1, title: on('side-xss-stored') ? title : esc(title), body: on('side-xss-stored') ? body : esc(body) }); s.json({ ok: true }) })
    add('GET', base + '/posts', 'list'); add('POST', base + '/posts', 'compose')
  },

  // -------- import: XXE --------
  import(x) {
    const { router, base, on, variant, add } = x
    router.post(base + '/import', (q, s) => {
      const xml = (q.body && q.body.xml) || ''
      try { const doc = on('xxe') ? parseXXE(xml) : require('libxmljs2').parseXml(xml, { noent: false }); const pick = (t) => { const n = doc.get('//' + t); return n ? n.text() : null }; s.json({ imported: { ref: pick('ref'), customer: pick('customer'), amount: pick('amount') } }) }
      catch (e) { s.status(400).json({ error: e.message }) }
    })
    add('POST', base + '/import', 'import')
  },

  // -------- fileportal: LFI read (traversal / absolute / null-byte) + (admin) upload webshell --------
  fileportal(x) {
    const { router, base, on, variant, add, requireAdmin } = x
    router.get(base + '/file', (q, s) => {
      const nameRaw = q.query.name || 'welcome.txt'
      const v = variant('lfi') || 'traversal'
      try {
        if (on('lfi')) {
          let target
          if (v === 'absolute' && /^\//.test(nameRaw)) target = nameRaw
          else if (v === 'null-byte') target = path.join(DOCS_DIR, String(nameRaw).split('\0')[0])
          else target = path.join(DOCS_DIR, nameRaw)
          return s.type('text/plain').send(fs.readFileSync(target, 'utf8'))
        }
        if (!/^[\w.-]+$/.test(nameRaw)) return s.status(400).json({ error: 'bad name' })
        s.type('text/plain').send(fs.readFileSync(path.join(DOCS_DIR, path.basename(nameRaw)), 'utf8'))
      }
      catch (e) { s.status(404).json({ error: 'not found' }) }
    })
    add('GET', base + '/file', 'read')
    mountUpload(x, requireAdmin)
  },

  // -------- webhook: SSRF (full/redirect/gopher) + cloud-metadata SSRF that leaks the app key --------
  webhook(x) {
    const { router, base, on, variant, add } = x
    router.post(base + '/fetch', async (q, s) => {
      const { url, method = 'GET', headers = {}, body } = q.body || {}
      if (!url) return s.status(400).json({ error: 'url required' })

      // ssrf-cloudmeta — pretend to be AWS IMDS / GCP metadata; leaks HS256 signing key
      if (on('ssrf-cloudmeta')) {
        const meta = variant('ssrf-cloudmeta') || 'aws-imds'
        const key = fs.readFileSync(KEY_PATH, 'utf8').trim()
        if (meta === 'aws-imds' && /169\.254\.169\.254\/latest\/meta-data\/iam\/security-credentials/i.test(url)) {
          return s.json({ status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ AccessKeyId: 'ASIA' + key.slice(0, 12), SecretAccessKey: key, Token: 'IQoJb3JpZ2lu' }) })
        }
        if (meta === 'gcp-metadata' && /metadata\.google\.internal\/computeMetadata\/v1\/instance\/service-accounts/i.test(url)) {
          return s.json({ status: 200, headers: { 'metadata-flavor': 'Google' }, body: JSON.stringify({ access_token: key, expires_in: 3600, token_type: 'Bearer' }) })
        }
      }

      const gopher = on('side-ssrf-gopher') && /^gopher:/i.test(url)  // side vuln — accepts gopher but doesn't grant RCE
      if (gopher) return s.json({ status: 200, headers: { 'x-scheme': 'gopher' }, body: 'gopher stream (' + url + ') accepted' })

      if (!on('ssrf') && isPrivate(url)) return s.status(400).json({ error: 'destination not allowed' })
      try {
        // redirect variant — for the "redirect" flavor, we deliberately follow redirects to internal hosts
        const opts = { method, headers: headers && typeof headers === 'object' ? headers : {}, body: body !== undefined && method !== 'GET' && method !== 'HEAD' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined }
        if (on('ssrf') && (variant('ssrf') || 'full') === 'redirect') opts.redirect = 'follow'
        const r = await fetch(url, opts)
        const t = await r.text()
        const h = {}
        r.headers.forEach((v, k) => { h[k] = v })
        s.json({ status: r.status, headers: h, body: t })
      }
      catch (e) { s.status(502).json({ error: e.message }) }
    })
    add('POST', base + '/fetch', 'fetch')
    if (on('side-open-redirect')) { router.get(base + '/go', (q, s) => s.redirect(String(q.query.url || '/'))); add('GET', base + '/go', 'redirect') }
  },

  // -------- disclosure: source/config/key + admin apikey leak (git/bak/sourcemap/swagger-example) --------
  disclosure(x) {
    const { router, base, on, variant, add, view } = x
    const spec = () => {
      const spec = { openapi: '3.0.0', info: { title: 'mutie API', version: '1.0' }, paths: {} }
      const v = variant('disclosure-source') || 'swagger-example'
      if (on('disclosure-source') && v === 'swagger-example') {
        // Swagger examples include the admin password + signing key ("copy-pasted from prod").
        spec.paths = { '/login': { post: { summary: 'auth', requestBody: { content: { 'application/json': { example: { username: ADMIN_USER, password: (fs.readFileSync(CONF_PATH, 'utf8').match(/admin\.password=(\S+)/) || [,''])[1] } } } } } } }
        spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
      } else if (on('disclosure-source')) {
        // Other variants also stash the same info in x-internal so /openapi.json continues to be an
        // acquisition surface (the variant just changes WHICH extra route also leaks).
        spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
      }
      if (on('apikey-leak')) spec['x-admin-key'] = x.__adminKey()
      return spec
    }
    router.get(base + '/openapi.json', (q, s) => s.json(spec()))
    add('GET', base + '/openapi.json', 'docs')
    router.get(base + '/backup', (q, s) => { if (on('disclosure-source')) return s.type('text/plain').send(fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim()); s.status(404).json({ error: 'not found' }) })
    add('GET', base + '/backup', 'backup-file')
    // Variant-specific ADDITIONAL leak routes — each variant lights up a different disclosure surface.
    if (on('disclosure-source')) {
      const v = variant('disclosure-source') || 'swagger-example'
      if (v === 'git') {
        router.get(base + '/.git/config', (q, s) => s.type('text/plain').send(
          '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = git@internal:mutie/app.git\n' +
          '# leaked config below\n' + fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim() + '\n'
        ))
        add('GET', base + '/.git/config', 'git-config')
      } else if (v === 'bak') {
        router.get(base + '/app.conf.bak', (q, s) => s.type('text/plain').send(fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim()))
        add('GET', base + '/app.conf.bak', 'bak')
      } else if (v === 'sourcemap') {
        router.get(base + '/bundle.js.map', (q, s) => s.json({
          version: 3, file: 'bundle.js', sources: ['../server/config/app.conf', '../server/secret/app.key'],
          sourcesContent: [fs.readFileSync(CONF_PATH, 'utf8'), fs.readFileSync(KEY_PATH, 'utf8').trim()],
          names: [], mappings: '',
        }))
        add('GET', base + '/bundle.js.map', 'sourcemap')
      }
    }
    if (on('side-verbose-errors')) {
      router.get(base + '/_debug', (q, s) => s.status(500).json({ error: 'debug: SELECT * FROM products WHERE id = NULL', stack: new Error('sample').stack }))
      add('GET', base + '/_debug', 'debug')
    }
  },

  // -------- account: register/login/reset/profile/lookup/deserial + remember-me + timing/msg enum --------
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
      const { username, password, remember } = q.body || {}
      let user, exists
      if (on('login-bypass')) { try { user = db.prepare("SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'").get() } catch (e) { } } // SQLi auth bypass
      else user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password)
      exists = db.prepare('SELECT 1 FROM users WHERE username=?').get(username)
      // side-user-enum — timing variant delays if user does NOT exist; message variant differentiates errors
      if (on('side-user-enum') && !user) {
        const v = variant('side-user-enum') || 'message'
        if (v === 'timing' && !exists) { const t = Date.now() + 200; while (Date.now() < t) { /* spin */ } }
        if (v === 'message') return s.status(401).json({ error: exists ? 'invalid password' : 'unknown user' })
      }
      if (!user) return s.status(401).json({ error: 'invalid credentials' })
      const issued = auth_issue(x, s, user)
      // remember-me — set an additional cookie that maps back to the user on future requests
      if (on('remember-me') && remember) {
        const v = variant('remember-me') || 'base64-username'
        const val = v === 'base64-username' ? Buffer.from(user.username).toString('base64') : user.username
        const prev = s.getHeader('Set-Cookie') || ''
        s.setHeader('Set-Cookie', [].concat(prev, 'mutie_remember=' + val + '; Path=/; HttpOnly'))
      }
      s.json(Object.assign({ user: { username: user.username, role: user.role } }, issued))
    })
    add('POST', base + '/login', 'login')
    // side-refresh-noop — reusable refresh token (never rotates); side vuln
    if (on('side-refresh-noop')) {
      router.post(base + '/refresh', (q, s) => s.json({ token: 'rt-persist-' + (q.body && q.body.username || 'anon'), expires: 0 }))
      add('POST', base + '/refresh', 'refresh')
    }
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
    // login-as / impersonation — mints a credential for ANY username with no admin check
    if (on('login-as')) {
      router.post(base + '/login-as', (q, s) => {
        const un = (q.body && q.body.username) || ADMIN_USER
        const user = db.prepare('SELECT * FROM users WHERE username=?').get(un)
        if (!user) return s.status(404).json({ error: 'no such user' })
        const issued = auth_issue(x, s, user)
        s.json(Object.assign({ user: { username: user.username, role: user.role } }, issued))
      })
      add('POST', base + '/login-as', 'login-as')
    }
    // BOLA write — trusts an attacker-supplied username and writes ANY user's record (set admin's pw)
    if (on('bola-write')) {
      router.post(base + '/profile-write', requireAuth, (q, s) => {
        const { username, password, email } = q.body || {}
        if (!username) return s.status(400).json({ error: 'username required' })
        if (password != null) db.prepare('UPDATE users SET password=? WHERE username=?').run(password, username)
        if (email != null) db.prepare('UPDATE users SET email=? WHERE username=?').run(email, username)
        s.json({ ok: true, updated: username })
      })
      add('POST', base + '/profile-write', 'profile-write')
    }
    if (on('sink-deserial')) mountDeserial(x, requireAdmin)
  },

  // -------- admin report generator: SSTI (eval / ejs / handlebars / pug) --------
  adminreport(x) {
    const { router, base, on, variant, add, requireAdmin } = x
    router.post(base + '/render', requireAdmin, (q, s) => {
      const { template, data } = q.body || {}
      const d = data && typeof data === 'object' ? data : {}
      if (!on('sink-ssti')) return s.json({ output: String(template == null ? '' : template).replace(/\{\{([\s\S]+?)\}\}/g, (_, k) => esc(d[k.trim()])) })
      const v = variant('sink-ssti') || 'eval'
      try {
        let out
        if (v === 'ejs') out = ejs.render(String(template || ''), d)
        else if (v === 'handlebars') out = tripleBraceRender(template, d)      // {{{ expr }}}
        else if (v === 'pug') out = pugSSTIRender(template, d)                 // pug source
        else out = evalRender(template, d)                                     // eval — {{ expr }}
        s.json({ output: out })
      }
      catch (e) { s.status(400).json({ error: e.message }) }
    })
    add('POST', base + '/render', 'render')
    if (on('side-csv-injection')) {
      router.get(base + '/export.csv', (q, s) => { const rows = [['name', 'note'], ['user1', '=IMPORTXML("http://evil/x","//c")'], ['user2', 'hi']]; s.type('text/csv').send(rows.map(r => r.join(',')).join('\n')) })
      add('GET', base + '/export.csv', 'export')
    }
  },

  // -------- admin backup / jobs: command injection (tar / ping / zip / git) + deserial on jobs --------
  adminbackup(x) {
    const { router, base, on, variant, add, requireAdmin } = x
    router.post(base + '/backup', requireAdmin, (q, s) => {
      const body = q.body || {}
      const v = on('sink-cmdi') ? (variant('sink-cmdi') || 'tar') : null
      try {
        if (v === 'ping') {
          const host = body.host || 'localhost'
          const out = execSync('ping -c 1 ' + host).toString(); return s.json({ ok: true, log: out })
        }
        if (v === 'zip') {
          const name = body.name || 'backup'
          const out = execSync('zip -q /tmp/' + name + '.zip /app/config/app.conf').toString(); return s.json({ ok: true, log: out })
        }
        if (v === 'git') {
          const branch = body.branch || 'main'
          const out = execSync('git log --oneline -1 ' + branch + ' 2>&1 || echo done').toString(); return s.json({ ok: true, log: out })
        }
        if (v === 'tar') {
          const name = body.name || 'backup'
          const out = execSync('tar czf /tmp/' + name + '.tgz /app/config').toString(); return s.json({ ok: true, log: out })
        }
        const name = String(body.name || 'backup').replace(/[^\w.-]/g, '_')
        execSync('tar czf /tmp/' + name + '.tgz /app/config'); s.json({ ok: true })
      }
      catch (e) { s.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
    })
    add('POST', base + '/backup', 'backup')
    if (on('sink-deserial')) mountDeserial(x, x.requireAdmin)
  },

  // -------- admin extensions: upload webshell --------
  adminupload(x) { mountUpload(x, x.requireAdmin) },

  // -------- feature / decoy: benign list + several side vulns --------
  feature(x) {
    const { router, base, on, variant, add, requireAuth } = x
    const items = x.store(x.view.id)
    if (!items.length) for (let i = 1; i <= 6; i++) items.push({ id: i, owner: i % 2 ? 'alice' : 'bob', title: x.view.title + ' #' + i, secret: 'note-' + i })
    router.get(base + '/list', (q, s) => s.json(items.map(i => ({ id: i.id, title: i.title }))))
    add('GET', base + '/list', 'list')
    router.get(base + '/item/:id', on('side-idor') ? (q, s, n) => n() : requireAuth, (q, s) => { const it = items.find(i => i.id === Number(q.params.id)); it ? s.json(it) : s.status(404).json({ error: 'not found' }) })
    add('GET', base + '/item/:id', 'detail')
    if (on('side-open-redirect')) { router.get(base + '/go', (q, s) => s.redirect(String(q.query.url || '/'))); add('GET', base + '/go', 'redirect') }
    if (on('side-price')) {
      router.post(base + '/checkout', (q, s) => { const items = (q.body && q.body.items) || []; let t = 0; for (const it of items) t += (Number(it.price) || 0) * (Number(it.qty) || 1); s.json({ total: Math.round(t * 100) / 100 }) })
      add('POST', base + '/checkout', 'checkout')
    }
    if (on('side-coupon')) {
      const seen = new Set()
      router.post(base + '/coupon', (q, s) => {
        const codes = (q.body && q.body.codes) || []
        const v = variant('side-coupon') || 'stack'
        let discount = 0
        for (const c of codes) {
          if (v === 'reuse') { if (seen.has(c)) continue; seen.add(c) }
          discount += 10   // no cap on stack — every applied code compounds
        }
        s.json({ discount })
      })
      add('POST', base + '/coupon', 'coupon')
    }
    if (on('side-oversell')) {
      let stock = 5
      router.post(base + '/order', (q, s) => {
        const qty = Number((q.body && q.body.qty) || 1)
        if (variant('side-oversell') === 'negative-qty') { stock -= qty; return s.json({ ok: true, stock }) }
        // "no-check": happily accepts any qty even beyond stock
        return s.json({ ok: true, ordered: qty, stock })
      })
      add('POST', base + '/order', 'order')
    }
    if (on('side-bfla')) {
      router.get(base + '/admin-info', (q, s) => s.json({ notice: 'this route should require admin — it does not' }))
      add('GET', base + '/admin-info', 'admin-info')
    }
    if (on('side-ac-header')) {
      const v = variant('side-ac-header') || 'x-original-url'
      router.get(base + '/private/:id', (q, s, n) => {
        // ordinary access-control gate — bypassable via the variant
        if (v === 'x-original-url' && (q.headers['x-original-url'] || '').startsWith(base + '/public')) return s.json({ id: q.params.id, secret: 'via-original-url' })
        if (v === 'method-override' && (q.headers['x-http-method-override'] || '').toUpperCase() === 'HEAD') return s.json({ id: q.params.id, secret: 'via-method-override' })
        if (v === 'trailing-slash' && q.originalUrl.endsWith('/')) return s.json({ id: q.params.id, secret: 'via-trailing-slash' })
        if (v === 'referer-gate' && /internal/i.test(q.headers.referer || '')) return s.json({ id: q.params.id, secret: 'via-referer' })
        return requireAuth(q, s, () => s.json({ id: q.params.id, secret: 'authenticated' }))
      })
      add('GET', base + '/private/:id', 'private')
    }
    if (on('side-csv-injection')) {
      router.get(base + '/export.csv', (q, s) => { const rows = [['id', 'title'], ...items.map(i => [i.id, i.title])]; s.type('text/csv').send(rows.map(r => r.join(',')).join('\n')) })
      add('GET', base + '/export.csv', 'export')
    }
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
// ---- benign functional surface: a universal /meta plus kind-appropriate real endpoints on EVERY
// block (comments, tags, stats, sessions, jobs, changelog, …). These carry NO vulns — they exist to
// make each block feel like a real app and to widen the backend surface a scanner must wade through.
// New endpoint `kind`s the blind solver doesn't look for, so they never affect the 40/40 guarantee.
function mountExtras(x, kind) {
  const { router, base, add, view, requireAuth } = x
  const seedNum = String(view.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  router.get(base + '/meta', (q, s) => s.json({ id: view.id, app: view.app, kind, title: view.title, slug: view.slug, uiVariant: view.uiVariant }))
  add('GET', base + '/meta', 'meta')

  if (kind === 'content') {
    const comments = x.store(view.id + ':comments')
    if (!comments.length) comments.push({ id: 1, user: 'alice', text: 'Nice one!' }, { id: 2, user: 'bob', text: 'Thanks for sharing.' })
    router.get(base + '/comments', (q, s) => s.json(comments)); add('GET', base + '/comments', 'comments')
    router.post(base + '/comments', (q, s) => { comments.push({ id: comments.length + 1, user: esc((q.body && q.body.user) || 'guest'), text: esc((q.body && q.body.text) || '') }); s.json({ ok: true }) })
    add('POST', base + '/comments', 'comment-add')
    router.get(base + '/tags', (q, s) => s.json(['news', 'featured', 'popular', 'editor-pick', 'trending', view.app].map((t, i) => ({ tag: t, count: 3 + (i * 7 % 20) })))); add('GET', base + '/tags', 'tags')
    router.get(base + '/related', (q, s) => s.json(db.prepare('SELECT id,name,category,price FROM products WHERE id % 3 = ? LIMIT 6').all(seedNum % 3))); add('GET', base + '/related', 'related')
  } else if (kind === 'feature') {
    router.get(base + '/stats', (q, s) => s.json({ views: 1000 + seedNum, likes: seedNum % 300, shares: seedNum % 40 })); add('GET', base + '/stats', 'stats')
    router.get(base + '/activity', (q, s) => s.json([{ ts: 't-1', who: 'alice', what: 'updated' }, { ts: 't-2', who: 'bob', what: 'commented' }])); add('GET', base + '/activity', 'activity')
    const favs = x.store(view.id + ':favs')
    router.post(base + '/favorite/:id', (q, s) => { const id = Number(q.params.id); const i = favs.indexOf(id); i >= 0 ? favs.splice(i, 1) : favs.push(id); s.json({ ok: true, favorited: favs.includes(id) }) })
    add('POST', base + '/favorite/:id', 'favorite')
  } else if (kind === 'account') {
    router.get(base + '/sessions', requireAuth, (q, s) => s.json([{ id: 's1', ua: 'Chrome', ip: '10.0.0.5', current: true }, { id: 's2', ua: 'Safari', ip: '10.0.0.9' }])); add('GET', base + '/sessions', 'sessions')
    router.get(base + '/activity', requireAuth, (q, s) => s.json([{ ts: 't-1', event: 'login', ip: '10.0.0.5' }, { ts: 't-2', event: 'password-change' }])); add('GET', base + '/activity', 'activity')
  } else if (kind === 'webhook') {
    router.get(base + '/deliveries', (q, s) => s.json([{ id: 1, url: 'https://example.com/hook', status: 200 }, { id: 2, url: 'https://example.com/hook2', status: 500 }])); add('GET', base + '/deliveries', 'deliveries')
  } else if (kind === 'disclosure') {
    router.get(base + '/changelog', (q, s) => s.json([{ v: '1.2.0', notes: 'new endpoints' }, { v: '1.1.0', notes: 'bugfixes' }])); add('GET', base + '/changelog', 'changelog')
    router.get(base + '/health', (q, s) => s.json({ status: 'ok', uptime: seedNum })); add('GET', base + '/health', 'health')
  } else if (kind === 'fileportal') {
    router.get(base + '/files', (q, s) => s.json(['welcome.txt', 'readme.md', 'notes.txt'].map((n, i) => ({ name: n, size: 100 + i * 50 })))); add('GET', base + '/files', 'files')
    router.get(base + '/recent', (q, s) => s.json([{ name: 'welcome.txt', at: 't-1' }])); add('GET', base + '/recent', 'recent')
  } else if (kind === 'adminreport') {
    router.get(base + '/templates', (q, s) => s.json(['weekly', 'monthly', 'incident'].map((t, i) => ({ id: i + 1, name: t })))); add('GET', base + '/templates', 'templates')
    router.get(base + '/schedule', (q, s) => s.json([{ id: 1, cron: '0 9 * * 1', report: 'weekly' }])); add('GET', base + '/schedule', 'schedule')
  } else if (kind === 'adminbackup') {
    router.get(base + '/jobs', (q, s) => s.json([{ id: 1, name: 'nightly', status: 'ok' }, { id: 2, name: 'weekly', status: 'queued' }])); add('GET', base + '/jobs', 'jobs')
    router.get(base + '/history', (q, s) => s.json([{ id: 1, at: 't-1', size: '4.2MB' }])); add('GET', base + '/history', 'history')
  } else if (kind === 'import') {
    router.get(base + '/history', (q, s) => s.json([{ id: 1, file: 'invoices.xml', rows: 12 }])); add('GET', base + '/history', 'history')
    router.get(base + '/mappings', (q, s) => s.json([{ from: 'ref', to: 'reference' }, { from: 'amount', to: 'total' }])); add('GET', base + '/mappings', 'mappings')
  } else if (kind === 'adminupload') {
    router.get(base + '/installed', (q, s) => s.json([{ name: 'core', version: '1.0' }, { name: 'analytics', version: '2.1' }])); add('GET', base + '/installed', 'installed')
  }
}

// ---- fleet-audit side vulns (maze walls; grant nothing toward RCE). Each gated by its placement. ----
function mountSide(x) {
  const { router, base, on, variant, add, requireAuth } = x
  if (on('side-cors')) { router.get(base + '/cors-data', (q, s) => { s.setHeader('Access-Control-Allow-Origin', q.headers.origin || '*'); s.setHeader('Access-Control-Allow-Credentials', 'true'); s.json({ data: 'sensitive', user: 'demo' }) }); add('GET', base + '/cors-data', 'cors-data') }
  if (on('side-host-header')) { router.post(base + '/pw-reset-link', (q, s) => s.json({ link: 'https://' + (q.headers.host || 'app') + '/reset?token=abc' })); add('POST', base + '/pw-reset-link', 'reset-link') }
  if (on('side-cache-poison')) { router.get(base + '/client-config', (q, s) => { s.setHeader('Cache-Control', 'public, max-age=300'); s.json({ apiBase: 'https://' + (q.headers['x-forwarded-host'] || q.headers.host || 'app') + '/api' }) }); add('GET', base + '/client-config', 'client-config') }
  if (on('side-cookie-flags')) { router.post(base + '/remember-weak', (q, s) => { s.setHeader('Set-Cookie', 'remember=' + ((q.body && q.body.username) || 'x') + '; Path=/'); s.json({ ok: true }) }); add('POST', base + '/remember-weak', 'remember-weak') }
  if (on('side-clickjack')) { router.get(base + '/embed', (q, s) => s.type('html').send('<h1>Account actions</h1><button>Delete account</button>')); add('GET', base + '/embed', 'embed') }
  if (on('side-email-header')) { router.post(base + '/contact', (q, s) => s.json({ ok: true, headers: 'From: ' + ((q.body && q.body.name) || '') })); add('POST', base + '/contact', 'contact') }
  if (on('side-redos')) { router.get(base + '/validate', (q, s) => { const e = String(q.query.email || ''); try { /^([a-zA-Z0-9]+)+@example\.com$/.test(e.slice(0, 40)) } catch { } s.json({ valid: /@/.test(e) }) }); add('GET', base + '/validate', 'validate') }
  if (on('side-csrf')) { router.get(base + '/set-email', (q, s) => s.json({ ok: true, email: q.query.email || '' })); add('GET', base + '/set-email', 'set-email') }
  if (on('side-xpath')) { router.get(base + '/staff', (q, s) => { const all = /'|\)/.test(String(q.query.name || '')); s.json({ staff: all ? ['alice', 'bob', 'admin'] : ['alice'] }) }); add('GET', base + '/staff', 'staff') }
  if (on('side-ldap')) { router.get(base + '/directory', (q, s) => { const all = /\*|\)\(/.test(String(q.query.user || '')); s.json({ users: all ? ['alice', 'bob', 'admin'] : [] }) }); add('GET', base + '/directory', 'directory') }
  if (on('side-nosql')) { router.post(base + '/nlogin', (q, s) => { const bypass = q.body && typeof q.body.password === 'object'; s.json({ ok: !!bypass, note: bypass ? 'operator accepted' : 'invalid' }) }); add('POST', base + '/nlogin', 'nlogin') }
  if (on('side-excessive-data')) { router.get(base + '/cards', (q, s) => s.json([{ brand: 'visa', pan: '4111111111111111', cvv: '123', holder: 'alice' }])); add('GET', base + '/cards', 'cards') }
  if (on('side-cms-unauth')) { router.put(base + '/article/:slug', (q, s) => s.json({ ok: true, slug: q.params.slug, body: (q.body && q.body.body) || '' })); add('PUT', base + '/article/:slug', 'article') }
  if (on('side-privesc-self')) { router.post(base + '/become-seller', requireAuth, (q, s) => { db.prepare("UPDATE users SET role='seller' WHERE username=?").run(q.user.username); s.json({ ok: true, role: 'seller' }) }); add('POST', base + '/become-seller', 'become-seller') }
  if (on('side-refund-abuse')) { router.post(base + '/refund', (q, s) => s.json({ ok: true, credited: Number((q.body && q.body.amount) || 0) })); add('POST', base + '/refund', 'refund') }
  if (on('side-status-abuse')) { router.post(base + '/order-status', (q, s) => s.json({ ok: true, status: (q.body && q.body.status) || 'delivered' })); add('POST', base + '/order-status', 'order-status') }
  if (on('side-race')) { let seen = false; router.post(base + '/redeem', (q, s) => { seen = true; s.json({ ok: true, credit: 5 }) }); add('POST', base + '/redeem', 'redeem') }
  if (on('side-giftcard-enum')) { router.get(base + '/giftcard/:code', (q, s) => s.json({ code: q.params.code, balance: 25 })); add('GET', base + '/giftcard/:code', 'giftcard') }
  if (on('side-credit-transfer')) { router.post(base + '/transfer', (q, s) => s.json({ ok: true, amount: Number((q.body && q.body.amount) || 0) })); add('POST', base + '/transfer', 'transfer') }
  if (on('side-predictable-apikey')) { router.post(base + '/apikey', (q, s) => s.json({ apikey: 'ak_' + Buffer.from(String((q.body && q.body.username) || 'user')).toString('hex') })); add('POST', base + '/apikey', 'apikey') }
  if (on('side-dom-xss')) { router.get(base + '/widget', (q, s) => s.type('html').send('<div id="o"></div><script>document.getElementById("o").innerHTML=decodeURIComponent((location.search.split("q=")[1]||""))</script>')); add('GET', base + '/widget', 'widget') }
  if (on('side-rfi')) { router.get(base + '/include', async (q, s) => { const u = String(q.query.page || ''); if (/^https?:/i.test(u)) { try { const r = await fetch(u); return s.type('text/plain').send(await r.text()) } catch (e) { return s.status(502).json({ error: e.message }) } } s.json({ page: u }) }); add('GET', base + '/include', 'include') }
  if (on('side-header-trust')) { router.get(base + '/admin-metrics', (q, s) => { const v = variant('side-header-trust') || 'x-admin'; const ok = v === 'x-admin' ? (q.headers['x-admin'] === 'true') : (q.headers['x-forwarded-for'] === '127.0.0.1'); return ok ? s.json({ metrics: { users: 42, revenue: 1000 } }) : s.status(403).json({ error: 'forbidden' }) }); add('GET', base + '/admin-metrics', 'admin-metrics') }
}

function mountDeserial(x, requireAdmin) {
  const { router, base, on, variant, add } = x
  router.post(base + '/import-job', requireAdmin, (q, s) => {
    try {
      const raw = (q.body && q.body.job) || '{}'
      const v = variant('sink-deserial') || 'node-serialize'
      let o
      if (v === 'funcster') {
        // funcster-style: {"__js_function":"function(){return ...}()"}  — cheat: eval it via Function.
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (parsed && parsed.__js_function) o = { name: String(new Function('return (' + parsed.__js_function + ')()')()) }
        else o = parsed
      } else {
        o = serialize.unserialize(typeof raw === 'string' ? raw : JSON.stringify(raw))
      }
      s.json({ ok: true, result: String((o && o.name) || 'job loaded') })
    }
    catch (e) { s.status(500).json({ error: e.message }) }
  })
  add('POST', base + '/import-job', 'import-job')
}

module.exports = { mountAll, KIND }
