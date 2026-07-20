import express from 'express';
import { db, nid, findOrder, findInv, findUser } from './db.js';
import { sign, userFromReq } from './auth.js';

export const router = express.Router();
function auth(req, res, next) { const u = userFromReq(req); if (!u) return res.status(401).json({ error: 'unauthorized' }); req.user = u; next(); }

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = db.users.find((x) => x.username === username && x.password === password);
  if (!u) return res.status(401).json({ error: 'invalid credentials' });
  res.json({ token: sign(u), user: { id: u.id, username: u.username, shopName: u.shopName } });
});
router.get('/me', auth, (req, res) => { const u = findUser(req.user.id); res.json({ id: u.id, username: u.username, shopName: u.shopName }); });

// own shop's orders
router.get('/orders', auth, (req, res) => res.json(db.orders.filter((o) => o.shopId === req.user.id).slice().reverse()));
// VULN[bola]: any order by id, no ownership check
router.get('/orders/:id', auth, (req, res) => { const o = findOrder(req.params.id); if (!o) return res.status(404).json({ error: 'not found' }); res.json(o); });
// VULN[bola]: approve / deliver / decline ANY shop's order
const setStatus = (s) => (req, res) => { const o = findOrder(req.params.id); if (!o) return res.status(404).json({ error: 'not found' }); o.status = s; res.json(o); };
router.post('/orders/:id/approve', auth, setStatus('approved'));
router.post('/orders/:id/deliver', auth, setStatus('delivering'));
router.post('/orders/:id/decline', auth, setStatus('declined'));

router.get('/inventory', auth, (req, res) => res.json(db.inventory.filter((i) => i.shopId === req.user.id)));
router.post('/inventory', auth, (req, res) => {
  const { name, qty, price } = req.body || {};
  const it = { id: nid('inv'), shopId: req.user.id, name, qty: Number(qty) || 0, price: Number(price) || 0 };
  db.inventory.push(it); res.json(it);
});
// VULN[bola]: edit / delete ANY shop's inventory
router.patch('/inventory/:id', auth, (req, res) => {
  const it = findInv(req.params.id); if (!it) return res.status(404).json({ error: 'not found' });
  const b = req.body || {};
  if (b.name != null) it.name = b.name;
  if (b.qty != null) it.qty = Number(b.qty);
  if (b.price != null) it.price = Number(b.price);
  res.json(it);
});
router.delete('/inventory/:id', auth, (req, res) => {
  const i = db.inventory.findIndex((x) => x.id === req.params.id);
  if (i >= 0) db.inventory.splice(i, 1);
  res.json({ ok: true });
});

router.get('/invoices', auth, (req, res) => res.json(
  db.orders.filter((o) => o.shopId === req.user.id && ['approved', 'delivering', 'delivered'].includes(o.status))
    .map((o) => ({ id: o.id, customer: o.customer, item: o.itemName, total: o.total, status: o.status, date: o.createdAt }))
));
// VULN[bola]: any invoice by id (incl. other shops' customer + totals)
router.get('/invoices/:id', auth, (req, res) => {
  const o = findOrder(req.params.id); if (!o) return res.status(404).json({ error: 'not found' });
  res.json({ id: o.id, shopId: o.shopId, customer: o.customer, item: o.itemName, qty: o.qty, unitPrice: o.unitPrice, total: o.total, status: o.status, date: o.createdAt });
});
router.get('/payments', auth, (req, res) => {
  const paid = db.orders.filter((o) => o.shopId === req.user.id && ['delivering', 'delivered'].includes(o.status));
  res.json({ count: paid.length, total: Math.round(paid.reduce((t, o) => t + o.total, 0) * 100) / 100 });
});
// VULN[bola]: any shop's stats/revenue by id
router.get('/shops/:id', auth, (req, res) => {
  const u = findUser(req.params.id); if (!u) return res.status(404).json({ error: 'not found' });
  const orders = db.orders.filter((o) => o.shopId === u.id);
  res.json({ id: u.id, shopName: u.shopName, orderCount: orders.length, revenue: Math.round(orders.filter((o) => o.status === 'delivered').reduce((t, o) => t + o.total, 0) * 100) / 100 });
});
