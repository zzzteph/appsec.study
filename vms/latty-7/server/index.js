const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const path = require('path')
const db = require('./db')

const SECRET = 'menuforge-secret'
const app = express()
app.use(cors())
app.use(express.json())

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.users.find(u => u.username === username && u.password === password)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: jwt.sign({ username: u.username, restaurantId: u.restaurantId }, SECRET, { expiresIn: '4h' }), user: { username: u.username, restaurantId: u.restaurantId } })
})

// every /api route below requires a valid JWT
app.use('/api', (req, res, next) => {
  if (req.path === '/login') return next()
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return res.status(401).json({ error: 'auth required' })
  try { req.user = jwt.verify(m[1], SECRET); next() }
  catch { return res.status(401).json({ error: 'invalid token' }) }
})

app.get('/api/me', (req, res) => res.json({ username: req.user.username, restaurantId: req.user.restaurantId }))

// ---------------------------------------------------------------------------------------------------
// Restaurant → Menu → Item CRUD. Resources are addressed by UUID and the handlers only check that the
// entity exists and is nested correctly — they DO NOT check that it belongs to the logged-in partner.
// VULN[bola/idor]: any authenticated partner can read/create/update/delete ANY restaurant's menus &
// items if they know its (unpredictable) UUID. UUIDs aren't enumerable, so cross-reference the two
// accounts (test1/test2) to obtain the other partner's restaurantId, then walk & tamper their tree.
// ---------------------------------------------------------------------------------------------------

const R = express.Router({ mergeParams: true })
app.use('/api/restaurant/:rid', (req, res, next) => {           // NO ownership check — pure BOLA
  const r = db.findRestaurant(req.params.rid)
  if (!r) return res.status(404).json({ error: 'restaurant not found' })
  req.restaurant = r; next()
}, R)

R.get('/', (req, res) => { const r = req.restaurant; res.json({ id: r.id, name: r.name, cuisine: r.cuisine, owner: r.owner, menuCount: r.menus.length }) })

// menus
R.get('/menu', (req, res) => res.json(req.restaurant.menus.map(m => ({ id: m.id, name: m.name, active: m.active, itemCount: m.items.length }))))
R.post('/menu', (req, res) => { const { name, description, active } = req.body || {}; if (!name) return res.status(400).json({ error: 'name required' }); const m = db.mkMenu(name, [], { description, active }); req.restaurant.menus.push(m); res.status(201).json(m) })
R.get('/menu/:mid', (req, res) => { const m = db.findMenu(req.params.rid, req.params.mid); if (!m) return res.status(404).json({ error: 'menu not found' }); res.json({ id: m.id, name: m.name, description: m.description, active: m.active, itemCount: m.items.length }) })
R.put('/menu/:mid', (req, res) => { const m = db.findMenu(req.params.rid, req.params.mid); if (!m) return res.status(404).json({ error: 'menu not found' }); for (const k of ['name', 'description', 'active']) if (k in (req.body || {})) m[k] = req.body[k]; res.json({ id: m.id, name: m.name, description: m.description, active: m.active }) })
R.delete('/menu/:mid', (req, res) => { const r = req.restaurant; const i = r.menus.findIndex(m => m.id === req.params.mid); if (i < 0) return res.status(404).json({ error: 'menu not found' }); r.menus.splice(i, 1); res.json({ ok: true }) })

// items
R.get('/menu/:mid/items', (req, res) => { const m = db.findMenu(req.params.rid, req.params.mid); if (!m) return res.status(404).json({ error: 'menu not found' }); res.json(m.items) })
R.post('/menu/:mid/items', (req, res) => { const m = db.findMenu(req.params.rid, req.params.mid); if (!m) return res.status(404).json({ error: 'menu not found' }); const b = req.body || {}; if (!b.name) return res.status(400).json({ error: 'name required' }); const it = db.mkItem(b.name, Number(b.price) || 0, b); m.items.push(it); res.status(201).json(it) })
R.get('/menu/:mid/items/:iid', (req, res) => { const it = db.findItem(req.params.rid, req.params.mid, req.params.iid); if (!it) return res.status(404).json({ error: 'item not found' }); res.json(it) })
R.put('/menu/:mid/items/:iid', (req, res) => { const it = db.findItem(req.params.rid, req.params.mid, req.params.iid); if (!it) return res.status(404).json({ error: 'item not found' }); for (const k of ['name', 'price', 'description', 'section', 'allergens', 'available']) if (k in (req.body || {})) it[k] = req.body[k]; res.json(it) })
R.delete('/menu/:mid/items/:iid', (req, res) => { const m = db.findMenu(req.params.rid, req.params.mid); if (!m) return res.status(404).json({ error: 'menu not found' }); const i = m.items.findIndex(x => x.id === req.params.iid); if (i < 0) return res.status(404).json({ error: 'item not found' }); m.items.splice(i, 1); res.json({ ok: true }) })

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('latty-7 (MenuForge) on :80'))
