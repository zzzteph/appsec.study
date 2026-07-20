// GraphQL transport — mounted at /graphql. Schema is FIXED (block is an argument, not a field name)
// so the surface stays uniform across mutations, but resolvers dispatch per-block placement and honour
// the same primitives + variants as the REST registry. This deliberately carries all the same vulns:
// arg-concatenation SQLi, BOLA via ID/username args, SSRF in fetch, SSTI in render, cmdi in backup, etc.
//
// GraphQL-specific side vulns are always ON in this transport (they're intrinsic to the schema):
//   introspection ................ enabled (default) — attackers can enumerate the schema
//   "Did you mean" suggestions ... enabled (default) — helps recover schema even with introspection off
//   alias-batching ............... allowed — many aliased queries in a single request
//   CSRF ......................... /graphql accepts application/x-www-form-urlencoded bodies
//
// Auth is resolved from the same HTTP layer as REST (authmodes.resolve(req)), so JWT/session/apikey
// all continue to work — you attach the same credential and dispatch through /graphql.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const ejs = require('ejs')
const serialize = require('node-serialize')
const { graphql, buildSchema, GraphQLScalarType, Kind, printSchema } = require('graphql')
const { db } = require('./db')
const { parseXXE } = require('./xml')
const { CONF_PATH, KEY_PATH, ADMIN_USER } = require('./secrets')
const { esc, isPrivate, evalRender, tripleBraceRender, pugSSTIRender } = require('./vulns')

const DOCS_DIR = path.join(__dirname, 'docs')
const EXT_DIR = path.join(__dirname, 'ext')

// ---- schema (fixed shape; resolvers key off `block`) ----
const SCHEMA_SRC = `
  scalar JSON
  type User { username: String, role: String, email: String, password: String, apikey: String }
  type AuthResult { token: String, apiKey: String, ok: Boolean, user: User }
  type BackupResult { ok: Boolean, log: String }
  type FetchResult { status: Int, headers: JSON, body: String }
  type RenderResult { output: String }
  type UploadResult { ok: Boolean, saved: String }
  type Invoice { ref: String, customer: String, amount: String }
  type Post { id: Int, title: String, body: String }
  type Item { id: Int, title: String, owner: String, secret: String, category: String, name: String, price: Float, rating: Float }
  type Query {
    manifest: JSON
    contentItems(block: String!): [Item]
    contentSearch(block: String!, q: String!): JSON
    contentPosts(block: String!): [Post]
    featureList(block: String!): [Item]
    featureItem(block: String!, id: Int!): Item
    fileRead(block: String!, name: String!): String
    openapi(block: String!): JSON
    backupFile(block: String!): String
    userLookup(block: String!, username: String!): User
    me: User
  }
  type Mutation {
    composePost(block: String!, title: String, body: String): Post
    uploadExt(block: String!, filename: String!, content: String): UploadResult
    runExt(block: String!, name: String!): RenderResult
    fetch(block: String!, url: String!, method: String, headers: JSON, body: JSON): FetchResult
    register(block: String!, username: String!, password: String!, role: String): AuthResult
    login(block: String!, username: String!, password: String!, remember: Boolean): AuthResult
    reset(block: String!, username: String!): JSON
    resetConfirm(block: String!, username: String!, token: String!, password: String!): JSON
    updateProfile(email: String, bio: String, role: String, password: String): User
    render(block: String!, template: String!, data: JSON): RenderResult
    backup(block: String!, name: String, host: String, branch: String): BackupResult
    importJob(block: String!, job: String!): JSON
    importInvoice(block: String!, xml: String!): Invoice
  }
`

function buildGqlSchema() {
  const schema = buildSchema(SCHEMA_SRC)
  // wire the JSON scalar so `headers`, `data`, `body` accept arbitrary shapes
  const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'Arbitrary JSON',
    serialize(v) { return v },
    parseValue(v) { return v },
    parseLiteral(ast) {
      switch (ast.kind) {
        case Kind.STRING: case Kind.BOOLEAN: return ast.value
        case Kind.INT: case Kind.FLOAT: return Number(ast.value)
        case Kind.OBJECT: { const o = {}; for (const f of ast.fields) o[f.name.value] = this.parseLiteral(f.value); return o }
        case Kind.LIST: return ast.values.map(v => this.parseLiteral(v))
        case Kind.NULL: return null
        default: return null
      }
    },
  })
  const typeMap = schema.getTypeMap()
  const target = typeMap.JSON
  if (target) Object.assign(target, JSONScalar)
  return schema
}

// ---- resolver factory (per mutation) ----
function makeResolvers(mut, auth) {
  const byId = Object.fromEntries(mut.views.map(v => [v.id, v]))
  const placementsByBlock = {}
  for (const p of mut.placements) (placementsByBlock[p.block] = placementsByBlock[p.block] || []).push(p)
  const on = (block, prim) => (placementsByBlock[block] || []).some(x => x.prim === prim)
  const variantOf = (block, prim) => { const p = (placementsByBlock[block] || []).find(x => x.prim === prim); return p ? p.variant : null }

  function needAuth(ctx) { const u = auth.resolve(ctx.req); if (!u) throw new Error('auth required'); ctx.user = u; return u }
  function needAdmin(ctx) { const u = needAuth(ctx); if (u.role !== 'admin') throw new Error('admin only'); return u }

  const stores = {}
  const store = (k) => (stores[k] || (stores[k] = []))

  return {
    manifest: () => ({
      seed: mut.seed, api: mut.api, auth: mut.auth,
      views: mut.views.map(v => ({ id: v.id, app: v.app, kind: v.kind, title: v.title, slug: v.slug, uiVariant: v.uiVariant })),
    }),
    contentItems: ({ block }) => db.prepare('SELECT id,name,category,price,rating FROM products LIMIT 30').all(),
    contentSearch: ({ block, q }) => {
      const term = q || ''
      const v = on(block, 'sqli') ? (variantOf(block, 'sqli') || 'union') : null
      try {
        if (!on(block, 'sqli')) return db.prepare('SELECT id,name,category FROM products WHERE name LIKE ?').all('%' + term + '%')
        const sql = "SELECT id,name,category FROM products WHERE name LIKE '%" + term + "%'"
        if (v === 'blind-time' && /'/.test(term)) {
          try { db.prepare("SELECT randomblob(20000000) WHERE (" + term.replace(/^%'|--\s*$/g, '') + ")").all() } catch {}
        }
        const rows = db.prepare(sql).all()
        if (v === 'blind-bool') return { found: rows.length }
        return rows
      } catch (e) {
        if (v === 'error') throw new Error('query failed: SELECT id,name,category FROM products WHERE name LIKE \'%' + term + '%\' — ' + e.message)
        throw e
      }
    },
    contentPosts: ({ block }) => store(block),
    composePost: ({ block, title, body }) => {
      const posts = store(block); const p = { id: posts.length + 1, title: on(block, 'side-xss-stored') ? title : esc(title), body: on(block, 'side-xss-stored') ? body : esc(body) }; posts.push(p); return p
    },
    featureList: ({ block }) => {
      const view = byId[block] || {}; const items = store(block)
      if (!items.length) for (let i = 1; i <= 6; i++) items.push({ id: i, owner: i % 2 ? 'alice' : 'bob', title: (view.title || 'Item') + ' #' + i, secret: 'note-' + i })
      return items.map(i => ({ id: i.id, title: i.title }))
    },
    featureItem: ({ block, id }, ctx) => {
      if (!on(block, 'side-idor')) needAuth(ctx)
      const items = store(block); const it = items.find(i => i.id === Number(id))
      return it || null
    },
    fileRead: ({ block, name }) => {
      const nameRaw = name || 'welcome.txt'; const v = variantOf(block, 'lfi') || 'traversal'
      try {
        if (on(block, 'lfi')) {
          let target
          if (v === 'absolute' && /^\//.test(nameRaw)) target = nameRaw
          else if (v === 'null-byte') target = path.join(DOCS_DIR, String(nameRaw).split('\0')[0])
          else target = path.join(DOCS_DIR, nameRaw)
          return fs.readFileSync(target, 'utf8')
        }
        if (!/^[\w.-]+$/.test(nameRaw)) throw new Error('bad name')
        return fs.readFileSync(path.join(DOCS_DIR, path.basename(nameRaw)), 'utf8')
      } catch (e) { throw new Error('not found') }
    },
    openapi: ({ block }) => {
      const spec = { openapi: '3.0.0', info: { title: 'mutie API', version: '1.0' }, paths: {} }
      const v = variantOf(block, 'disclosure-source') || 'swagger-example'
      if (on(block, 'disclosure-source') && v === 'swagger-example') {
        spec.paths = { '/login': { post: { summary: 'auth', requestBody: { content: { 'application/json': { example: { username: ADMIN_USER, password: (fs.readFileSync(CONF_PATH, 'utf8').match(/admin\.password=(\S+)/) || [,''])[1] } } } } } } }
        spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
      } else if (on(block, 'disclosure-source')) {
        spec['x-internal'] = { config: fs.readFileSync(CONF_PATH, 'utf8'), signingKey: fs.readFileSync(KEY_PATH, 'utf8').trim() }
      }
      if (on(block, 'apikey-leak')) spec['x-admin-key'] = auth.ADMIN_KEYFN()
      return spec
    },
    backupFile: ({ block }) => {
      if (!on(block, 'disclosure-source')) throw new Error('not found')
      return fs.readFileSync(CONF_PATH, 'utf8') + '\nSIGNING_KEY=' + fs.readFileSync(KEY_PATH, 'utf8').trim()
    },
    userLookup: ({ block, username }, ctx) => {
      needAuth(ctx)
      const u = db.prepare('SELECT username,role,email,password,apikey FROM users WHERE username=?').get(username)
      if (!u) throw new Error('not found')
      return on(block, 'bola-read') ? u : { username: u.username, role: u.role, email: u.email }
    },
    me: (_a, ctx) => needAuth(ctx),
    uploadExt: ({ block, filename, content }, ctx) => {
      needAdmin(ctx)
      if (!on(block, 'sink-upload') && !/\.(txt|md)$/.test(filename)) throw new Error('only .txt/.md')
      fs.mkdirSync(EXT_DIR, { recursive: true }); fs.writeFileSync(path.join(EXT_DIR, filename), content == null ? '' : String(content))
      return { ok: true, saved: filename }
    },
    runExt: ({ block, name }, ctx) => {
      needAdmin(ctx)
      if (!on(block, 'sink-upload')) throw new Error('execution disabled')
      const full = path.join(EXT_DIR, name)
      if (variantOf(block, 'sink-upload') === 'ejs-template') return { output: ejs.render(fs.readFileSync(full, 'utf8'), {}) }
      const f = require.resolve(full); delete require.cache[f]; const m = require(f); const fn = typeof m === 'function' ? m : (m && m.run)
      return { output: String(fn ? fn() : m) }
    },
    fetch: async ({ block, url, method = 'GET', headers = {}, body }) => {
      if (!url) throw new Error('url required')
      if (on(block, 'ssrf-cloudmeta')) {
        const meta = variantOf(block, 'ssrf-cloudmeta') || 'aws-imds'
        const key = fs.readFileSync(KEY_PATH, 'utf8').trim()
        if (meta === 'aws-imds' && /169\.254\.169\.254\/latest\/meta-data\/iam\/security-credentials/i.test(url))
          return { status: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ AccessKeyId: 'ASIA' + key.slice(0, 12), SecretAccessKey: key, Token: 'IQoJb3JpZ2lu' }) }
        if (meta === 'gcp-metadata' && /metadata\.google\.internal\/computeMetadata\/v1\/instance\/service-accounts/i.test(url))
          return { status: 200, headers: { 'metadata-flavor': 'Google' }, body: JSON.stringify({ access_token: key, expires_in: 3600, token_type: 'Bearer' }) }
      }
      if (on(block, 'side-ssrf-gopher') && /^gopher:/i.test(url)) return { status: 200, headers: { 'x-scheme': 'gopher' }, body: 'gopher accepted' }
      if (!on(block, 'ssrf') && isPrivate(url)) throw new Error('destination not allowed')
      const opts = { method, headers: headers && typeof headers === 'object' ? headers : {}, body: body !== undefined && method !== 'GET' && method !== 'HEAD' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined }
      if (on(block, 'ssrf') && (variantOf(block, 'ssrf') || 'full') === 'redirect') opts.redirect = 'follow'
      const r = await global.fetch(url, opts); const t = await r.text(); const h = {}
      r.headers.forEach((v, k) => { h[k] = v })
      return { status: r.status, headers: h, body: t }
    },
    register: ({ block, username, password, role }) => {
      if (!username || !password) throw new Error('username/password required')
      if (db.prepare('SELECT 1 FROM users WHERE username=?').get(username)) throw new Error('taken')
      const r = on(block, 'side-massassign') && role ? role : 'user'
      db.prepare('INSERT INTO users(username,password,role,email,apikey) VALUES (?,?,?,?,?)').run(username, password, r, username + '@mutie.local', 'ak_live_' + Math.random().toString(16).slice(2, 10))
      return { ok: true, user: { username, role: r } }
    },
    login: ({ block, username, password, remember }, ctx) => {
      let user
      if (on(block, 'login-bypass')) { try { user = db.prepare("SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'").get() } catch {} }
      else user = db.prepare('SELECT * FROM users WHERE username=? AND password=?').get(username, password)
      const exists = db.prepare('SELECT 1 FROM users WHERE username=?').get(username)
      if (on(block, 'side-user-enum') && !user) {
        const v = variantOf(block, 'side-user-enum') || 'message'
        if (v === 'timing' && !exists) { const t = Date.now() + 200; while (Date.now() < t) {} }
        if (v === 'message') throw new Error(exists ? 'invalid password' : 'unknown user')
      }
      if (!user) throw new Error('invalid credentials')
      const issued = auth.issue(ctx.res, user)
      if (on(block, 'remember-me') && remember) {
        const v = variantOf(block, 'remember-me') || 'base64-username'
        const val = v === 'base64-username' ? Buffer.from(user.username).toString('base64') : user.username
        const prev = ctx.res.getHeader('Set-Cookie') || ''
        ctx.res.setHeader('Set-Cookie', [].concat(prev, 'mutie_remember=' + val + '; Path=/; HttpOnly'))
      }
      return Object.assign({ user: { username: user.username, role: user.role } }, issued)
    },
    reset: ({ block, username }) => {
      if (!on(block, 'reset-weak')) return { ok: true, message: 'if the account exists, an email was sent' }
      const token = 'rt-' + username
      if (variantOf(block, 'reset-weak') === 'leaked-in-response') return { ok: true, token }
      return { ok: true, message: 'reset email sent' }
    },
    resetConfirm: ({ block, username, token, password }) => {
      if (!on(block, 'reset-weak') || token !== 'rt-' + username) throw new Error('invalid token')
      db.prepare('UPDATE users SET password=? WHERE username=?').run(password, username); return { ok: true }
    },
    updateProfile: (args, ctx) => {
      const u = needAuth(ctx)
      // In gql we don't carry a block param on updateProfile — allow mass-assignment if ANY active
      // account block has `side-massassign` enabled (equivalent to "some account block permits it").
      const massassign = mut.placements.some(p => p.prim === 'side-massassign')
      const allow = massassign ? ['email', 'bio', 'role', 'password'] : ['email', 'bio']
      for (const k of allow) if (k in args && args[k] != null) db.prepare('UPDATE users SET ' + k + '=? WHERE username=?').run(args[k], u.username)
      return db.prepare('SELECT username,role,email FROM users WHERE username=?').get(u.username)
    },
    render: ({ block, template, data }, ctx) => {
      needAdmin(ctx)
      const d = data && typeof data === 'object' ? data : {}
      if (!on(block, 'sink-ssti')) return { output: String(template == null ? '' : template).replace(/\{\{([\s\S]+?)\}\}/g, (_, k) => esc(d[k.trim()])) }
      const v = variantOf(block, 'sink-ssti') || 'eval'
      let out
      if (v === 'ejs') out = ejs.render(String(template || ''), d)
      else if (v === 'handlebars') out = tripleBraceRender(template, d)
      else if (v === 'pug') out = pugSSTIRender(template, d)
      else out = evalRender(template, d)
      return { output: out }
    },
    backup: ({ block, name, host, branch }, ctx) => {
      needAdmin(ctx)
      const v = on(block, 'sink-cmdi') ? (variantOf(block, 'sink-cmdi') || 'tar') : null
      try {
        if (v === 'ping') return { ok: true, log: execSync('ping -c 1 ' + (host || 'localhost')).toString() }
        if (v === 'zip')  return { ok: true, log: execSync('zip -q /tmp/' + (name || 'backup') + '.zip /app/config/app.conf').toString() }
        if (v === 'git')  return { ok: true, log: execSync('git log --oneline -1 ' + (branch || 'main') + ' 2>&1 || echo done').toString() }
        if (v === 'tar')  return { ok: true, log: execSync('tar czf /tmp/' + (name || 'backup') + '.tgz /app/config').toString() }
        const sn = String(name || 'backup').replace(/[^\w.-]/g, '_'); execSync('tar czf /tmp/' + sn + '.tgz /app/config')
        return { ok: true, log: '' }
      } catch (e) { throw new Error(e.message + '\n' + ((e.stdout && e.stdout.toString()) || '')) }
    },
    importJob: ({ block, job }, ctx) => {
      needAdmin(ctx)
      try {
        const raw = job || '{}'; const v = variantOf(block, 'sink-deserial') || 'node-serialize'
        let o
        if (v === 'funcster') {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (parsed && parsed.__js_function) o = { name: String(new Function('return (' + parsed.__js_function + ')()')()) }
          else o = parsed
        } else o = serialize.unserialize(typeof raw === 'string' ? raw : JSON.stringify(raw))
        return { ok: true, result: String((o && o.name) || 'job loaded') }
      } catch (e) { throw new Error(e.message) }
    },
    importInvoice: ({ block, xml }) => {
      try {
        const doc = on(block, 'xxe') ? parseXXE(xml || '') : require('libxmljs2').parseXml(xml || '', { noent: false })
        const p = (t) => { const n = doc.get('//' + t); return n ? n.text() : null }
        return { ref: p('ref'), customer: p('customer'), amount: p('amount') }
      } catch (e) { throw new Error(e.message) }
    },
  }
}

// ---- express handler ----
function mountGraphQL(app, mut, auth) {
  const schema = buildGqlSchema()
  const rootValue = makeResolvers(mut, auth)
  const handler = async (req, res) => {
    let query, variables, operationName
    if (req.method === 'GET') { query = req.query.query; variables = req.query.variables && JSON.parse(req.query.variables); operationName = req.query.operationName }
    else { const b = req.body || {}; query = b.query; variables = b.variables; operationName = b.operationName }
    if (!query) return res.json({ data: null, errors: [{ message: 'query required' }] })
    try {
      const result = await graphql({ schema, source: query, rootValue, contextValue: { req, res }, variableValues: variables, operationName })
      res.json(result)
    } catch (e) { res.status(500).json({ errors: [{ message: e.message }] }) }
  }
  app.get('/graphql', handler)
  // JSON body (default parsing pipeline) + form-encoded (GraphQL-CSRF surface)
  const urlencoded = require('express').urlencoded({ extended: true, limit: '1mb' })
  app.post('/graphql', urlencoded, handler)
  // schema view for humans
  app.get('/graphql/schema', (q, s) => s.type('text/plain').send(printSchema(schema)))
}

module.exports = { mountGraphQL, buildGqlSchema }
