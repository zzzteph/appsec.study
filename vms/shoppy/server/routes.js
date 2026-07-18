import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  db, findItem, findUser, newCart, cartTotal, lineTotal, hash, scheduleOrder, nid, uuid
} from './db.js';
import { authPayload, signAccess, verifyRefresh, contextFromReq } from './auth.js';
import { rawSearchItems, rawSearchReviews, addReviewRow } from './sqlite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVOICE_DIR = path.join(__dirname, 'invoices');
const CONTENT_DIR = path.join(__dirname, 'content');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const ctx = (req) => contextFromReq(req);
const getCart = (c) => (c.cartId && db.carts.has(c.cartId) ? db.carts.get(c.cartId) : null);
function needAuth(c, res) { if (!c.user) { res.status(401).json({ error: 'authentication required' }); return false; } return true; }
const userView = (u) => (u ? { ...u, accessToken: signAccess(u) } : null);           // VULN[excessive-data]
const mapLine = (l) => ({ item: findItem(l.itemId), qty: l.qty, options: (l.optionIds || []).map((o) => db.optionsById.get(o)).filter(Boolean), lineTotal: lineTotal(l) });
const cartView = (c) => (c ? { id: c.id, lines: c.lines.map(mapLine), total: cartTotal(c) } : null);
const orderView = (o) => ({ ...o, lines: o.lines.map(mapLine) });
function paginate(list, page, pageSize) {
  const p = Math.max(1, +page || 1), ps = Math.max(1, +pageSize || 6);
  return { items: list.slice((p - 1) * ps, (p - 1) * ps + ps), total: list.length, page: p, pageSize: ps };
}

// ---------- auth ----------
router.post('/register', ah((req, res) => {
  const b = req.body || {};
  if (db.users.find((u) => u.username === b.username)) return res.status(409).json({ error: 'username already exists' }); // VULN[user-enum]
  const u = { id: uuid(), username: b.username, passwordHash: hash(b.password), role: b.role || 'user', // VULN[mass-assignment]
    credits: b.credits != null ? b.credits : 0, address: '', email: b.username + '@shoppy.test',
    voucher: 'WELCOME-' + String(b.username).toUpperCase(), invitedBy: null, favorites: [] };
  db.users.push(u);
  res.json(authPayload(u));
}));
router.post('/login', ah((req, res) => {
  const { username, password } = req.body || {};
  const u = db.users.find((x) => x.username === username);
  if (!u) return res.status(404).json({ error: 'no such user' });                    // VULN[user-enum]
  if (u.passwordHash !== hash(password)) return res.status(401).json({ error: 'incorrect password' });
  res.json(authPayload(u));
}));
router.post('/login-as', ah((req, res) => {                                          // VULN[login-as] no admin check
  const u = findUser((req.body || {}).userId);
  if (!u) return res.status(404).json({ error: 'no such user' });
  res.json(authPayload(u));
}));
router.post('/refresh', ah((req, res) => {                                           // VULN[refresh-no-rotation]
  const c = verifyRefresh((req.body || {}).refreshToken);
  const u = findUser(String(c.sub));
  if (!u) return res.status(401).json({ error: 'unknown user' });
  res.json(authPayload(u));
}));
router.post('/password/forgot', ah((req, res) => {
  const { username } = req.body || {};
  const u = db.users.find((x) => x.username === username);
  const token = Buffer.from('reset:' + username).toString('base64');                 // VULN[weak-reset]
  if (u) u._reset = token;
  res.json({ token });                                                               // VULN[reset-token-leak]
}));
router.post('/password/reset', ah((req, res) => {
  const { username, token, newPassword } = req.body || {};
  const u = db.users.find((x) => x.username === username);
  if (!u || token !== Buffer.from('reset:' + username).toString('base64')) return res.json({ ok: false });
  u.passwordHash = hash(newPassword);
  res.json({ ok: true });
}));

// ---------- catalog ----------
router.get('/shops', ah((req, res) => res.json(db.shops)));
router.get('/shops/:id', ah((req, res) => res.json(db.shops.find((s) => s.id === req.params.id) || null)));
router.get('/shops/:id/reviews', ah((req, res) => res.json(db.reviews.filter((r) => r.shopId === req.params.id))));
router.post('/shops/:id/reviews', ah((req, res) => {                                 // VULN[xss-stored-review]
  const c = ctx(req); const b = req.body || {};
  const r = { id: nid('review'), shopId: req.params.id, author: c.user ? c.user.username : 'guest', rating: b.rating, text: b.text };
  db.reviews.push(r); addReviewRow(r);
  res.json(r);
}));
router.get('/items', ah((req, res) => {
  let list = db.items;
  if (req.query.shopId) list = list.filter((i) => i.shopId === req.query.shopId);
  if (req.query.search) list = list.filter((i) => i.name.toLowerCase().includes(String(req.query.search).toLowerCase()));
  res.json(paginate(list, req.query.page, req.query.pageSize));
}));
router.get('/items/:id', ah((req, res) => res.json(findItem(req.params.id) || null)));
router.get('/search/items', ah((req, res) => res.json(rawSearchItems(req.query.q || ''))));       // VULN[sqli]
router.get('/search/reviews', ah((req, res) => res.json(rawSearchReviews(req.query.q || ''))));   // VULN[sqli]

// ---------- users ----------
router.get('/me', ah((req, res) => { const c = ctx(req); res.json(c.user ? userView(findUser(c.user.id)) : null); }));
router.get('/users', ah((req, res) => res.json(db.users.map(userView))));            // VULN[excessive-data]
router.get('/users/:id', ah((req, res) => res.json(userView(findUser(req.params.id))))); // VULN[bola-user]
router.get('/users/:id/orders', ah((req, res) => res.json(db.orders.filter((o) => o.userId === req.params.id)))); // VULN[bola-orders]
router.get('/users/:id/invitations', ah((req, res) =>                               // VULN[invite-idor]
  res.json(db.users.filter((u) => u.invitedBy === req.params.id).map((u) => ({ inviter: req.params.id, invitee: { id: u.id, username: u.username } })))));
router.get('/users/:id/favorites', ah((req, res) => res.json((findUser(req.params.id)?.favorites || []).map(findItem).filter(Boolean)))); // VULN[bola-favorites]
router.patch('/users/:id', ah((req, res) => {                                        // VULN[bola-profile]+[mass-assignment]+[user-enum]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const t = findUser(req.params.id); if (!t) return res.status(404).json({ error: 'no such user' });
  const b = req.body || {};
  if (b.username) {
    if (db.users.find((u) => u.username === b.username && u.id !== t.id)) return res.status(409).json({ error: 'username already taken' });
    t.username = b.username;
  }
  if (b.password) t.passwordHash = hash(b.password);
  if (b.address != null) t.address = b.address;
  if (b.role != null) t.role = b.role;
  if (b.credits != null) t.credits = b.credits;
  res.json(userView(t));
}));
router.post('/users/:id/email', ah((req, res) => {                                   // VULN[email-change-ato]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const t = findUser(req.params.id); if (!t) return res.status(404).json({ error: 'no such user' });
  t.email = (req.body || {}).email;
  res.json(userView(t));
}));
router.get('/recent-users', ah((req, res) => res.json(db.users.slice(-(+req.query.limit || 10)).map((u) => ({ id: u.id, username: u.username, role: u.role, invitedBy: u.invitedBy }))))); // VULN[hidden-admin]
router.post('/invite', ah((req, res) => {
  const c = ctx(req); if (!needAuth(c, res)) return;
  const u = db.users.find((x) => x.username === (req.body || {}).username);
  if (!u) return res.status(404).json({ error: 'no such user' });                    // VULN[user-enum]
  if (u.invitedBy) return res.status(409).json({ error: 'user already invited' });
  u.invitedBy = c.user.id;
  res.json({ ok: true });
}));
router.post('/favorites', ah((req, res) => {
  const c = ctx(req); if (!needAuth(c, res)) return;
  const u = findUser(c.user.id); const itemId = (req.body || {}).itemId;
  if (!u.favorites.includes(itemId)) u.favorites.push(itemId);
  res.json(u.favorites.map(findItem).filter(Boolean));
}));

// ---------- cart / checkout ----------
router.get('/cart', ah((req, res) => res.json(cartView(getCart(ctx(req))))));
router.post('/cart/items', ah((req, res) => {                                        // VULN[option-price-abuse]
  const c = ctx(req); const cart = getCart(c) || newCart();
  const b = req.body || {};
  if (!findItem(b.itemId)) return res.status(404).json({ error: 'no such item' });
  cart.lines.push({ itemId: b.itemId, qty: b.qty || 1, optionIds: b.optionIds || [] });
  res.json(cartView(cart));
}));
router.delete('/cart/items/:itemId', ah((req, res) => {
  const cart = getCart(ctx(req)); if (!cart) return res.status(404).json({ error: 'no cart' });
  cart.lines = cart.lines.filter((l) => l.itemId !== req.params.itemId);
  res.json(cartView(cart));
}));
router.post('/checkout', ah((req, res) => {
  const c = ctx(req); if (!needAuth(c, res)) return;
  const cart = getCart(c); if (!cart || !cart.lines.length) return res.status(400).json({ error: 'cart empty' });
  const b = req.body || {};
  let amount = b.total != null ? b.total : cartTotal(cart);                          // VULN[price-tamper]
  if (b.giftCardCode) { const gc = db.giftcards.find((g) => g.code === b.giftCardCode); if (gc) amount = Math.max(0, amount - gc.balance); } // VULN[bola-giftcard]
  if (b.coupons) for (const code of b.coupons) { const cp = db.coupons.find((x) => x.code === code && x.active); if (cp) amount = amount * (1 - cp.percent / 100); } // VULN[coupon-stacking]
  amount = Math.round(amount * 100) / 100;                                           // VULN[no-stock-check]
  const order = { id: nid('order'), userId: c.user.id, lines: cart.lines.map((l) => ({ ...l })), total: amount,
    status: 'placed', createdAt: new Date().toISOString(), cardLast4: String((b.card || {}).number || '').slice(-4),
    trackingCode: 'TRK-' + Math.floor(Math.random() * 900000 + 100000) };
  db.orders.push(order);
  const buyer = findUser(c.user.id); if (buyer && buyer.invitedBy) { const inv = findUser(buyer.invitedBy); if (inv) inv.credits += 3; }
  cart.lines = []; scheduleOrder(order);
  res.json(orderView(order));
}));

// ---------- orders ----------
router.get('/orders', ah((req, res) => { const c = ctx(req); res.json(c.user ? db.orders.filter((o) => o.userId === c.user.id).map(orderView) : []); }));
router.get('/orders/:id', ah((req, res) => { const o = db.orders.find((x) => x.id === req.params.id); res.json(o ? orderView(o) : null); })); // VULN[bola-order]
router.post('/orders/:id/refund', ah((req, res) => {                                 // VULN[refund-abuse]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const o = db.orders.find((x) => x.id === req.params.id); if (!o) return res.status(404).json({ error: 'no such order' });
  const refund = (req.body || {}).amount != null ? req.body.amount : o.total;
  findUser(c.user.id).credits += refund; o.status = 'refunded';
  res.json({ refunded: refund });
}));
router.post('/orders/:id/cancel', ah((req, res) => {                                 // VULN[bola-cancel]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const o = db.orders.find((x) => x.id === req.params.id); if (!o) return res.status(404).json({ error: 'no such order' });
  o.status = 'cancelled'; res.json(orderView(o));
}));
router.get('/orders/:id/notes', ah((req, res) => res.json(db.notes.filter((n) => n.orderId === req.params.id)))); // VULN[bola-notes]
router.post('/orders/:id/notes', ah((req, res) => {                                  // VULN[xss-stored-note]
  const c = ctx(req);
  const n = { id: nid('note'), orderId: req.params.id, author: c.user ? c.user.username : 'guest', text: (req.body || {}).text };
  db.notes.push(n); res.json(n);
}));
router.get('/orders/:id/invoice', ah((req, res) => {                                 // VULN[path-traversal]
  res.type('text/plain').send(fs.readFileSync(path.join(INVOICE_DIR, req.query.file || req.params.id + '.txt'), 'utf8'));
}));

// ---------- money ----------
router.get('/coupons', ah((req, res) => res.json(db.coupons)));
router.get('/giftcards/:code', ah((req, res) => res.json(db.giftcards.find((g) => g.code === req.params.code) || null))); // VULN[bola-giftcard]+[enum]
router.post('/giftcards', ah((req, res) => {                                          // VULN[giftcard-enum] sequential
  const c = ctx(req); if (!needAuth(c, res)) return;
  const gc = { code: 'GC-' + String(db.giftcards.length + 1).padStart(6, '0'), balance: (req.body || {}).amount, ownerId: c.user.id };
  db.giftcards.push(gc); res.json(gc);
}));
router.post('/giftcards/:code/redeem', ah((req, res) => {                             // VULN[bola-giftcard]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const gc = db.giftcards.find((g) => g.code === req.params.code); if (!gc) return res.status(404).json({ error: 'invalid gift card' });
  findUser(c.user.id).credits += gc.balance; gc.balance = 0; res.json(gc);
}));
router.post('/credits/transfer', ah((req, res) => {                                  // VULN[credits-transfer]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const b = req.body || {}; const from = findUser(c.user.id), to = findUser(b.toUserId);
  if (!to) return res.status(404).json({ error: 'no such user' });
  from.credits -= b.amount; to.credits += b.amount;
  res.json(userView(from));
}));

// ---------- cms / help ----------
router.get('/articles', ah((req, res) => res.json(db.articles)));
router.get('/articles/:slug', ah((req, res) => res.json(db.articles.find((a) => a.slug === req.params.slug) || null)));
router.put('/articles/:slug', ah((req, res) => {                                     // VULN[cms-unauth]
  const b = req.body || {}; let a = db.articles.find((x) => x.slug === req.params.slug);
  if (!a) { a = { id: nid('article'), slug: req.params.slug, question: b.question, answer: b.answer }; db.articles.push(a); }
  else { a.question = b.question; a.answer = b.answer; }
  res.json(a);
}));
router.get('/help', ah((req, res) => res.type('text/plain').send(fs.readFileSync(path.join(CONTENT_DIR, req.query.path), 'utf8')))); // VULN[path-traversal]

// ---------- seller / admin ops ----------
router.post('/seller', ah((req, res) => { const c = ctx(req); if (!needAuth(c, res)) return; const u = findUser(c.user.id); u.role = 'seller'; res.json(userView(u)); })); // VULN[privesc]
router.post('/items', ah((req, res) => {                                             // VULN[bfla]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const b = req.body || {}; const it = { id: nid('item'), shopId: b.shopId, name: b.name, price: b.price, description: b.name, category: 'misc', options: [], stock: 999 };
  db.items.push(it); res.json(it);
}));
router.patch('/items/:id', ah((req, res) => {                                        // VULN[bfla] negative price
  const c = ctx(req); if (!needAuth(c, res)) return;
  const it = findItem(req.params.id); if (!it) return res.status(404).json({ error: 'no such item' });
  const b = req.body || {};
  if (b.name != null) it.name = b.name;
  if (b.price != null) it.price = b.price;
  if (b.stock != null) it.stock = b.stock;
  res.json(it);
}));
router.patch('/shops/:id', ah((req, res) => {                                        // VULN[bfla]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const s = db.shops.find((x) => x.id === req.params.id); if (!s) return res.status(404).json({ error: 'no such shop' });
  const b = req.body || {};
  if (b.name != null) s.name = b.name;
  if (b.description != null) s.description = b.description;
  res.json(s);
}));

// ---------- webhooks / upload ----------
router.get('/webhooks', ah((req, res) => res.json(db.webhooks)));                    // VULN[bola-webhooks]
router.post('/webhooks', ah(async (req, res) => {                                    // VULN[ssrf]
  const c = ctx(req); if (!needAuth(c, res)) return;
  const url = (req.body || {}).url;
  db.webhooks.push({ id: nid('webhook'), url, ownerId: c.user.id });
  try { const r = await fetch(url, { method: 'GET' }); const body = await r.text(); res.json({ status: r.status, body: body.slice(0, 512) }); }
  catch (e) { res.json({ error: e.message }); }
}));
router.post('/upload', ah((req, res) => {                                            // VULN[file-upload] traversal + XSS
  const c = ctx(req); if (!needAuth(c, res)) return;
  const b = req.body || {};
  fs.writeFileSync(path.join(UPLOAD_DIR, b.filename), Buffer.from(b.contentBase64, 'base64'));
  res.json({ url: '/uploads/' + b.filename });
}));
