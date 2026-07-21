const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const path = require('path')
const db = require('./db')
require('./internal')                 // internal-only 127.0.0.1:9000 (SSRF target)
const spec = require('./openapi')

const SECRET = 'bytebites-jwt-secret'

// {{ }} evaluator — SSTI→RCE (Node process reachable)
const render = (tpl, ctx) => String(tpl == null ? '' : tpl).replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => { try { return String(Function('c', 'with(c){return(' + e + ')}')(ctx || {})) } catch (x) { return '{{err}}' } })

const app = express()
app.use(cors())
app.use(express.json())

// ---------- OpenAPI / Swagger UI ----------
const swaggerDir = require('swagger-ui-dist').getAbsoluteFSPath()
app.get('/openapi.json', (req, res) => res.json(spec))
app.use('/docs', express.static(swaggerDir, { index: false }))
app.get('/docs', (req, res) => res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Bytebites API</title>
<link rel="stylesheet" href="/docs/swagger-ui.css"></head><body><div id="swagger-ui"></div>
<script src="/docs/swagger-ui-bundle.js"></script><script src="/docs/swagger-ui-standalone-preset.js"></script>
<script>window.ui=SwaggerUIBundle({url:'/openapi.json',dom_id:'#swagger-ui',presets:[SwaggerUIBundle.presets.apis,SwaggerUIStandalonePreset],layout:'StandaloneLayout'})</script></body></html>`))
app.get('/', (req, res) => res.redirect('/docs'))

// ---------- auth ----------
// jwtauthtest: the ONLY unauthenticated endpoint. Supply a userId and get a valid JWT for THAT user —
// i.e. you can authenticate as anyone (a "test auth" left in production = broken authentication).
app.post('/auth/token', (req, res) => {
  const { userId } = req.body || {}
  if (userId === undefined || userId === null) return res.status(400).json({ error: 'userId required' })
  res.json({ token: jwt.sign({ sub: String(userId) }, SECRET, { expiresIn: '6h' }), tokenType: 'Bearer', userId: Number(userId) })
})

// every route below requires a Bearer JWT
app.use((req, res, next) => {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return res.status(401).json({ error: 'authorization required — get a token from POST /auth/token' })
  try { const d = jwt.verify(m[1], SECRET); req.userId = Number(d.sub); req.user = db.users.find(u => u.id === req.userId) || { id: req.userId }; next() }
  catch { return res.status(401).json({ error: 'invalid or expired token' }) }
})

app.get('/me', (req, res) => res.json(req.user))

// ---------- discovery ----------
app.get('/restaurants', (req, res) => res.json(db.restaurants.map(r => ({ id: r.id, name: r.name, cuisine: r.cuisine, rating: r.rating, deliveryFee: r.deliveryFee }))))
app.get('/restaurants/:id', (req, res) => { const r = db.restaurants.find(r => r.id === Number(req.params.id)); r ? res.json(r) : res.status(404).json({ error: 'not found' }) })

// ---------- users / addresses  (VULN[bola]: no ownership check) ----------
app.get('/users/:id', (req, res) => { const u = db.users.find(u => u.id === Number(req.params.id)); u ? res.json(u) : res.status(404).json({ error: 'not found' }) })
app.get('/users/:id/addresses', (req, res) => res.json(db.addresses.filter(a => a.userId === Number(req.params.id))))
app.get('/addresses/:id', (req, res) => { const a = db.addresses.find(a => a.id === Number(req.params.id)); a ? res.json(a) : res.status(404).json({ error: 'not found' }) })

// ---------- basket ----------
app.post('/baskets', (req, res) => { const b = { id: db.nb(), userId: req.userId, restaurantId: Number((req.body || {}).restaurantId) || null, items: [], promos: [] }; db.baskets.push(b); res.status(201).json(b) })
app.get('/baskets/:id', (req, res) => { const b = db.baskets.find(b => b.id === Number(req.params.id)); b ? res.json(b) : res.status(404).json({ error: 'not found' }) })  // VULN[bola]
app.post('/baskets/:id/items', (req, res) => {
  const b = db.baskets.find(b => b.id === Number(req.params.id)); if (!b) return res.status(404).json({ error: 'basket not found' })
  const mi = db.menuItem((req.body || {}).menuItemId); if (!mi) return res.status(400).json({ error: 'unknown menu item' })
  // VULN[business-logic]: quantity is not validated — a negative quantity yields a negative line total.
  const quantity = Number((req.body || {}).quantity); if (!Number.isFinite(quantity)) return res.status(400).json({ error: 'quantity required' })
  b.items.push({ menuItemId: mi.id, name: mi.name, price: mi.price, quantity })
  res.json(b)
})
app.post('/baskets/:id/promo', (req, res) => {
  const b = db.baskets.find(b => b.id === Number(req.params.id)); if (!b) return res.status(404).json({ error: 'basket not found' })
  const code = String((req.body || {}).code || '').toUpperCase(); if (!db.promos[code]) return res.status(400).json({ error: 'invalid promo code' })
  // VULN[business-logic]: the SAME code can be applied repeatedly — discounts stack.
  b.promos.push(code)
  res.json({ basketId: b.id, promos: b.promos })
})

// ---------- orders ----------
function priceBasket(b) {
  const rest = db.restaurants.find(r => r.id === b.restaurantId)
  const subtotal = b.items.reduce((s, it) => s + it.price * it.quantity, 0)
  let discount = 0
  for (const code of b.promos) { const p = db.promos[code]; discount += p.type === 'fixed' ? p.amount : subtotal * p.amount / 100 }
  const deliveryFee = rest ? rest.deliveryFee : 0
  return { subtotal: r2(subtotal), discount: r2(discount), deliveryFee, total: r2(subtotal - discount + deliveryFee) }
}
const r2 = (n) => Math.round(n * 100) / 100
app.post('/orders', (req, res) => {
  const b = db.baskets.find(b => b.id === Number((req.body || {}).basketId)); if (!b) return res.status(404).json({ error: 'basket not found' })
  const p = priceBasket(b)
  const o = { id: db.no(), userId: b.userId, restaurantId: b.restaurantId, items: b.items, ...p, status: 'placed', addressId: Number((req.body || {}).addressId) || null, refunds: [] }
  db.orders.push(o); res.status(201).json(o)
})
app.get('/orders', (req, res) => res.json(db.orders.filter(o => o.userId === req.userId)))
app.get('/orders/:id', (req, res) => { const o = db.orders.find(o => o.id === Number(req.params.id)); o ? res.json(o) : res.status(404).json({ error: 'not found' }) })  // VULN[bola]
app.post('/orders/:id/refund', (req, res) => {
  const o = db.orders.find(o => o.id === Number(req.params.id)); if (!o) return res.status(404).json({ error: 'not found' })
  // VULN[business-logic]: refunds are not idempotent and not blocked after delivery — call repeatedly.
  const amount = Number((req.body || {}).amount) || o.total
  o.refunds.push({ amount: r2(amount), at: 'now' })
  res.json({ orderId: o.id, refunded: r2(amount), totalRefunded: r2(o.refunds.reduce((s, r) => s + r.amount, 0)), refundCount: o.refunds.length })
})

// ---------- server-side issues ----------
// VULN[ssrf]: "import a restaurant logo from a URL" — server fetches an attacker-controlled URL with no
// allowlist, so it can reach internal-only services (e.g. http://127.0.0.1:9000/secret).
app.post('/restaurants/:id/logo', async (req, res) => {
  const url = (req.body || {}).url; if (!url) return res.status(400).json({ error: 'url required' })
  try { const r = await fetch(url); const body = await r.text(); res.json({ status: r.status, contentType: r.headers.get('content-type'), body: body.slice(0, 4000) }) }
  catch (e) { res.status(502).json({ error: e.message }) }
})
// VULN[ssti→rce]: custom receipt template rendered server-side with the order in scope.
app.post('/orders/:id/receipt', (req, res) => {
  const o = db.orders.find(o => o.id === Number(req.params.id)); if (!o) return res.status(404).json({ error: 'not found' })
  res.json({ receipt: render((req.body || {}).template, { order: o, total: o.total, items: o.items }) })
})

app.listen(80, () => console.log('latty-6 (Bytebites API) on :80'))
