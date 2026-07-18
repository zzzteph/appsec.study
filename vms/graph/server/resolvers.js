import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  db, findItem, findUser, newCart, cartTotal, lineTotal, hash, scheduleOrder, nid, uuid
} from './db.js';
import { authPayload, signAccess, verifyRefresh } from './auth.js';
import { rawSearchItems, rawSearchReviews, addReviewRow } from './sqlite.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INVOICE_DIR = path.join(__dirname, 'invoices');
const CONTENT_DIR = path.join(__dirname, 'content');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function paginate(list, page = 1, pageSize = 6) {
  const p = Math.max(1, page || 1), ps = Math.max(1, pageSize || 6);
  const start = (p - 1) * ps;
  return { items: list.slice(start, start + ps), total: list.length, page: p, pageSize: ps };
}
function getCart(ctx) { return ctx.cartId && db.carts.has(ctx.cartId) ? db.carts.get(ctx.cartId) : null; }
function requireAuth(ctx) { if (!ctx.user) throw new Error('authentication required'); return ctx.user; }
const mapLine = (l) => ({
  item: findItem(l.itemId), qty: l.qty,
  options: (l.optionIds || []).map((oid) => db.optionsById.get(oid)).filter(Boolean),
  lineTotal: lineTotal(l)
});

export const resolvers = {
  Query: {
    shops: () => db.shops,
    shop: (_, { id }) => db.shops.find((s) => s.id === id),
    items: (_, { shopId, search, page, pageSize }) => {
      let list = db.items;
      if (shopId) list = list.filter((i) => i.shopId === shopId);
      if (search) list = list.filter((i) => i.name.toLowerCase().includes(String(search).toLowerCase()));
      return paginate(list, page, pageSize);
    },
    item: (_, { id }) => findItem(id),
    searchItems: (_, { q }) => rawSearchItems(q),                     // VULN[graphql-sqli]
    searchReviews: (_, { q }) => rawSearchReviews(q),                 // VULN[graphql-sqli]
    me: (_, __, ctx) => (ctx.user ? findUser(ctx.user.id) : null),    // VULN[excessive-data]
    user: (_, { id }) => findUser(id),                               // VULN[bola-user]
    recentUsers: (_, { limit }) => db.users.slice(-(limit || 10)),   // VULN[hidden-admin]
    cart: (_, __, ctx) => getCart(ctx),
    order: (_, { id }) => db.orders.find((o) => o.id === id),         // VULN[bola-order]
    myOrders: (_, __, ctx) => (ctx.user ? db.orders.filter((o) => o.userId === ctx.user.id) : []),
    ordersByUser: (_, { userId }) => db.orders.filter((o) => o.userId === userId), // VULN[bola-orders]
    invitations: (_, { userId }) =>                                  // VULN[invite-idor]
      db.users.filter((u) => u.invitedBy === userId).map((u) => ({ inviter: userId, invitee: u })),
    reviews: (_, { shopId }) => db.reviews.filter((r) => r.shopId === shopId),
    giftCard: (_, { code }) => db.giftcards.find((g) => g.code === code), // VULN[bola-giftcard] + enum
    coupons: () => db.coupons,
    articles: () => db.articles,
    article: (_, { slug }) => db.articles.find((a) => a.slug === slug),
    invoice: (_, { orderId, file }) =>                               // VULN[path-traversal]
      fs.readFileSync(path.join(INVOICE_DIR, file || orderId + '.txt'), 'utf8'),
    helpDoc: (_, { path: p }) => fs.readFileSync(path.join(CONTENT_DIR, p), 'utf8'), // VULN[path-traversal]
    orderNotes: (_, { orderId }) => db.notes.filter((n) => n.orderId === orderId),   // VULN[bola-notes]
    favorites: (_, { userId }) => (findUser(userId)?.favorites || []).map(findItem).filter(Boolean), // VULN[bola-favorites]
    webhooks: () => db.webhooks                                      // VULN[bola-webhooks]
  },

  Mutation: {
    register: (_, { input }) => {
      if (db.users.find((u) => u.username === input.username)) throw new Error('username already exists'); // VULN[user-enum]
      const u = {
        id: uuid(), username: input.username, passwordHash: hash(input.password),
        role: input.role || 'user',                                  // VULN[mass-assignment]
        credits: input.credits != null ? input.credits : 0,          // VULN[mass-assignment]
        address: '', email: input.username + '@graphshop.test',
        voucher: 'WELCOME-' + input.username.toUpperCase(), invitedBy: null, favorites: []
      };
      db.users.push(u);
      return authPayload(u);
    },
    login: (_, { username, password }) => {
      const u = db.users.find((x) => x.username === username);
      if (!u) throw new Error('no such user');                       // VULN[user-enum]
      if (u.passwordHash !== hash(password)) throw new Error('incorrect password');
      return authPayload(u);
    },
    loginAs: (_, { userId }) => {                                    // VULN[login-as] no admin check
      const u = findUser(userId);
      if (!u) throw new Error('no such user');
      return authPayload(u);
    },
    refresh: (_, { refreshToken }) => {                              // VULN[refresh-no-rotation]
      const c = verifyRefresh(refreshToken);
      const u = findUser(String(c.sub));
      if (!u) throw new Error('unknown user');
      return authPayload(u);
    },
    requestPasswordReset: (_, { username }) => {
      const u = db.users.find((x) => x.username === username);
      const token = Buffer.from('reset:' + username).toString('base64'); // VULN[weak-reset]
      if (u) u._reset = token;
      return { token };                                              // VULN[reset-token-leak]
    },
    resetPassword: (_, { username, token, newPassword }) => {
      const u = db.users.find((x) => x.username === username);
      if (!u) return false;
      if (token !== Buffer.from('reset:' + username).toString('base64')) return false;
      u.passwordHash = hash(newPassword);
      return true;
    },
    addToCart: (_, { itemId, qty, optionIds }, ctx) => {
      const cart = getCart(ctx) || newCart();
      if (!findItem(itemId)) throw new Error('no such item');
      cart.lines.push({ itemId, qty: qty || 1, optionIds: optionIds || [] }); // VULN[option-price-abuse] + VULN[negative-qty]
      return cart;
    },
    removeFromCart: (_, { itemId }, ctx) => {
      const cart = getCart(ctx); if (!cart) throw new Error('no cart');
      cart.lines = cart.lines.filter((l) => l.itemId !== itemId);
      return cart;
    },
    checkout: (_, { card, total, giftCardCode, coupons }, ctx) => {
      requireAuth(ctx);
      const cart = getCart(ctx);
      if (!cart || !cart.lines.length) throw new Error('cart empty');
      let amount = total != null ? total : cartTotal(cart);          // VULN[price-tamper]
      if (giftCardCode) {
        const gc = db.giftcards.find((g) => g.code === giftCardCode); // VULN[bola-giftcard]
        if (gc) amount = Math.max(0, amount - gc.balance);
      }
      if (coupons) for (const code of coupons) {                     // VULN[coupon-stacking] no dedupe/cap
        const c = db.coupons.find((x) => x.code === code && x.active);
        if (c) amount = amount * (1 - c.percent / 100);
      }
      amount = Math.round(amount * 100) / 100;
      // VULN[no-stock-check]: stock is never validated or decremented (oversell).
      const order = {
        id: nid('order'), userId: ctx.user.id, lines: cart.lines.map((l) => ({ ...l })),
        total: amount, status: 'placed', createdAt: new Date().toISOString(),
        cardLast4: String(card.number).slice(-4), trackingCode: 'TRK-' + Math.floor(Math.random() * 900000 + 100000)
      };
      db.orders.push(order);
      const buyer = findUser(ctx.user.id);
      if (buyer && buyer.invitedBy) { const inv = findUser(buyer.invitedBy); if (inv) inv.credits += 3; }
      cart.lines = [];
      scheduleOrder(order);
      return order;
    },
    updateProfile: (_, { input, userId }, ctx) => {
      requireAuth(ctx);
      const target = userId ? findUser(userId) : findUser(ctx.user.id); // VULN[bola-profile]
      if (!target) throw new Error('no such user');
      if (input.username) {
        if (db.users.find((u) => u.username === input.username && u.id !== target.id))
          throw new Error('username already taken');                 // VULN[user-enum]
        target.username = input.username;
      }
      if (input.password) target.passwordHash = hash(input.password);
      if (input.address != null) target.address = input.address;
      return target;
    },
    changeEmail: (_, { email, userId }, ctx) => {                    // VULN[email-change-ato] BOLA, no verification
      requireAuth(ctx);
      const target = userId ? findUser(userId) : findUser(ctx.user.id);
      if (!target) throw new Error('no such user');
      target.email = email;
      return target;
    },
    invite: (_, { username }, ctx) => {
      requireAuth(ctx);
      const u = db.users.find((x) => x.username === username);
      if (!u) throw new Error('no such user');                       // VULN[user-enum]
      if (u.invitedBy) throw new Error('user already invited');      // VULN[user-enum]
      u.invitedBy = ctx.user.id;
      return 'invited ' + username;
    },
    buyGiftCard: (_, { amount, card }, ctx) => {
      requireAuth(ctx);
      const gc = { code: 'GC-' + String(db.giftcards.length + 1).padStart(6, '0'), balance: amount, ownerId: ctx.user.id }; // VULN[giftcard-enum] sequential
      db.giftcards.push(gc);
      return gc;
    },
    redeemGiftCard: (_, { code }, ctx) => {
      requireAuth(ctx);
      const gc = db.giftcards.find((g) => g.code === code);
      if (!gc) throw new Error('invalid gift card');                 // VULN[enum]
      const u = findUser(ctx.user.id);
      u.credits += gc.balance; gc.balance = 0;                       // VULN[bola-giftcard]
      return gc;
    },
    transferCredits: (_, { toUserId, amount }, ctx) => {             // VULN[credits-transfer] negative -> steal
      requireAuth(ctx);
      const from = findUser(ctx.user.id), to = findUser(toUserId);
      if (!to) throw new Error('no such user');
      from.credits -= amount; to.credits += amount;
      return from;
    },
    refundOrder: (_, { orderId, amount }, ctx) => {                  // VULN[refund-abuse] BOLA + unbounded
      requireAuth(ctx);
      const o = db.orders.find((x) => x.id === orderId);
      if (!o) throw new Error('no such order');
      const refund = amount != null ? amount : o.total;
      const u = findUser(ctx.user.id); u.credits += refund;
      o.status = 'refunded';
      return refund;
    },
    cancelOrder: (_, { orderId }, ctx) => {                          // VULN[bola-cancel]
      requireAuth(ctx);
      const o = db.orders.find((x) => x.id === orderId);
      if (!o) throw new Error('no such order');
      o.status = 'cancelled';
      return o;
    },
    addReview: (_, { shopId, rating, text }, ctx) => {
      const r = { id: nid('review'), shopId, author: ctx.user ? ctx.user.username : 'guest', rating, text }; // VULN[xss-stored-review]
      db.reviews.push(r); addReviewRow(r);
      return r;
    },
    updateArticle: (_, { slug, question, answer }) => {              // VULN[graphql-cms-unauth]
      let a = db.articles.find((x) => x.slug === slug);
      if (!a) { a = { id: nid('article'), slug, question, answer }; db.articles.push(a); }
      else { a.question = question; a.answer = answer; }
      return a;
    },
    addOrderNote: (_, { orderId, text }, ctx) => {                   // VULN[xss-stored-note] + no ownership
      const n = { id: nid('note'), orderId, author: ctx.user ? ctx.user.username : 'guest', text };
      db.notes.push(n);
      return n;
    },
    addFavorite: (_, { itemId }, ctx) => {
      requireAuth(ctx);
      const u = findUser(ctx.user.id);
      if (!u.favorites.includes(itemId)) u.favorites.push(itemId);
      return u.favorites.map(findItem).filter(Boolean);
    },
    becomeSeller: (_, __, ctx) => {                                  // VULN[privesc] self-promote
      requireAuth(ctx);
      const u = findUser(ctx.user.id); u.role = 'seller';
      return u;
    },
    createItem: (_, { shopId, name, price }, ctx) => {              // VULN[bfla] anyone adds items
      requireAuth(ctx);
      const it = { id: nid('item'), shopId, name, price, description: name, category: 'misc', options: [], stock: 999 };
      db.items.push(it);
      return it;
    },
    updateItem: (_, { id, name, price, stock }, ctx) => {           // VULN[bfla] edit any item, negative price
      requireAuth(ctx);
      const it = findItem(id); if (!it) throw new Error('no such item');
      if (name != null) it.name = name;
      if (price != null) it.price = price;
      if (stock != null) it.stock = stock;
      return it;
    },
    updateShop: (_, { id, name, description }, ctx) => {            // VULN[bfla] edit any shop
      requireAuth(ctx);
      const s = db.shops.find((x) => x.id === id); if (!s) throw new Error('no such shop');
      if (name != null) s.name = name;
      if (description != null) s.description = description;
      return s;
    },
    registerWebhook: async (_, { url }, ctx) => {                   // VULN[ssrf] server fetches arbitrary URL
      requireAuth(ctx);
      db.webhooks.push({ id: nid('webhook'), url, ownerId: ctx.user.id });
      try {
        const r = await fetch(url, { method: 'GET' });
        const body = await r.text();
        return 'HTTP ' + r.status + ' ' + body.slice(0, 512);
      } catch (e) { return 'fetch error: ' + e.message; }
    },
    uploadAsset: (_, { filename, contentBase64 }, ctx) => {         // VULN[file-upload] traversal + stored XSS
      requireAuth(ctx);
      const dest = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(dest, Buffer.from(contentBase64, 'base64'));
      return '/uploads/' + filename;
    }
  },

  Shop: {
    items: (s, { search, page, pageSize }) => {
      let list = db.items.filter((i) => i.shopId === s.id);
      if (search) list = list.filter((i) => i.name.toLowerCase().includes(String(search).toLowerCase()));
      return paginate(list, page, pageSize);
    },
    reviews: (s) => db.reviews.filter((r) => r.shopId === s.id)
  },
  Item: { shop: (i) => db.shops.find((s) => s.id === i.shopId), options: (i) => i.options || [] },
  Cart: { lines: (c) => c.lines.map(mapLine), total: (c) => cartTotal(c) },
  Order: { lines: (o) => o.lines.map(mapLine) },
  User: {
    accessToken: (u) => signAccess(u),                               // VULN[excessive-data]
    favorites: (u) => (u.favorites || []).map(findItem).filter(Boolean)
  }
};
