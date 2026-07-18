import crypto from 'crypto';

export const db = {
  shops: [], items: [], users: [], carts: new Map(), orders: [], reviews: [],
  giftcards: [], articles: [], coupons: [], webhooks: [], notes: [], optionsById: new Map()
};
const ids = { item: 1, order: 1, cart: 1, review: 1, gc: 1, article: 1, note: 1, webhook: 1 };
export const nid = (k) => String(ids[k]++);
export const uuid = () => crypto.randomUUID();
export function hash(p) { return crypto.createHash('sha256').update(String(p)).digest('hex'); }

// deterministic PRNG so the (large) seed is stable across restarts
const R = (() => { let s = 20260620; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
const pick = (a) => a[Math.floor(R() * a.length)];
const rint = (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));

function makeOptions() {
  const o = [
    { id: uuid(), group: 'size', name: 'Small', priceDelta: -2.0 },
    { id: uuid(), group: 'size', name: 'Medium', priceDelta: 0 },
    { id: uuid(), group: 'size', name: 'Large', priceDelta: 2.5 }
  ];
  if (R() < 0.5) o.push({ id: uuid(), group: 'extra', name: 'Gift wrap', priceDelta: 1.5 });
  if (R() < 0.4) o.push({ id: uuid(), group: 'extra', name: 'Express prep', priceDelta: 3.0 });
  return o;
}

function seed() {
  const shopDefs = [
    { id: 's1', name: 'Fresh Grocer', description: 'Fruit, veg & pantry staples' },
    { id: 's2', name: 'Gadget Hub', description: 'Electronics & accessories' },
    { id: 's3', name: 'Book Nook', description: 'Books & stationery' },
    { id: 's4', name: 'Home Corner', description: 'Kitchen & home goods' },
    { id: 's5', name: 'Sport Spot', description: 'Fitness & outdoors' },
    { id: 's6', name: 'Toy Box', description: 'Games & toys' }
  ];
  db.shops.push(...shopDefs);
  const words = {
    s1: ['Bananas', 'Avocados', 'Olive Oil', 'Almond Butter', 'Sourdough', 'Cold Brew', 'Granola', 'Dark Chocolate', 'Honey', 'Quinoa', 'Green Tea', 'Oat Milk'],
    s2: ['USB-C Cable', 'Bluetooth Speaker', 'Wireless Earbuds', 'Phone Stand', 'Power Bank', 'Webcam', 'Mechanical Keyboard', 'HDMI Adapter', 'Smart Plug', 'Laptop Sleeve', 'LED Strip', 'Mouse Pad'],
    s3: ['The Pragmatic Dev', 'Clean Code', 'Notebook A5', 'Gel Pens', 'Sci-Fi Anthology', 'Sticky Notes', 'Fountain Pen', 'Desk Planner', 'Highlighters', 'Sketchbook', 'Paperback Classics', 'Index Cards'],
    s4: ['Chef Knife', 'Cutting Board', 'Mixing Bowls', 'Cast Iron Pan', 'French Press', 'Storage Jars', 'Tea Towels', 'Spatula Set', 'Measuring Cups', 'Cookbook Stand', 'Oven Mitts', 'Salt Grinder'],
    s5: ['Yoga Mat', 'Dumbbells', 'Resistance Bands', 'Water Bottle', 'Running Socks', 'Jump Rope', 'Foam Roller', 'Gym Towel', 'Cycling Gloves', 'Trail Backpack', 'Head Torch', 'Cooling Towel'],
    s6: ['Building Blocks', 'Puzzle 1000pc', 'Board Game', 'Plush Bear', 'RC Car', 'Art Kit', 'Marble Run', 'Card Deck', 'Dinosaur Set', 'Kite', 'Science Kit', 'Wooden Train']
  };
  const cats = { s1: ['Produce', 'Pantry'], s2: ['Audio', 'Mobile'], s3: ['Fiction', 'Office'], s4: ['Kitchen', 'Home'], s5: ['Fitness', 'Outdoors'], s6: ['Games', 'Kids'] };
  for (const s of shopDefs) {
    const base = words[s.id];
    const count = rint(14, 22);
    for (let i = 0; i < count; i++) {
      const name = base[i % base.length] + (i >= base.length ? ' ' + (Math.floor(i / base.length) + 1) : '');
      const opts = makeOptions(); opts.forEach((o) => db.optionsById.set(o.id, o));
      db.items.push({
        id: nid('item'), shopId: s.id, name,
        price: Math.round((2 + R() * 40) * 100) / 100,
        description: `${name} — from ${s.name}`, category: pick(cats[s.id]),
        options: opts, stock: rint(0, 30)
      });
    }
  }

  const mk = (u, p, role, invitedBy) => ({
    id: uuid(), username: u, passwordHash: hash(p), role,
    credits: role === 'admin' ? 0 : Math.round(R() * 40 * 100) / 100,
    address: '', email: u + '@graphshop.test', voucher: 'WELCOME-' + u.toUpperCase(),
    invitedBy, favorites: [], _reset: null, _refresh: null
  });
  db.users.push(mk('admin', 'adminpass', 'admin', null));
  db.users.push(mk('alice', 'alice', 'user', null));
  const FIRST = ['bob', 'carol', 'dave', 'erin', 'frank', 'grace', 'heidi', 'ivan', 'judy', 'mallory',
    'niaj', 'olivia', 'peggy', 'trent', 'sybil', 'victor', 'walter', 'wendy', 'craig', 'faythe',
    'oscar', 'quinn', 'rupert', 'sasha', 'tariq', 'uma', 'vlad', 'xena', 'yara', 'zane'];
  const pool = [db.users[0], db.users[1]];
  for (const f of FIRST) { const u = mk(f, f + '123', 'user', pick(pool).id); db.users.push(u); pool.push(u); }
  while (db.users.length < 60) {
    const uname = 'user' + db.users.length;
    const u = mk(uname, uname + '123', 'user', pick(pool).id);
    db.users.push(u); pool.push(u);
  }

  const revTexts = ['Great, would buy again!', 'Fast delivery.', 'Cold fries, sadly.', 'Exactly as described.',
    'Five stars.', 'Packaging was crushed.', 'Best in town.', 'Meh, overpriced.', 'Lovely quality.', 'Arrived early!'];
  for (let i = 0; i < 60; i++) {
    const s = pick(shopDefs);
    db.reviews.push({ id: nid('review'), shopId: s.id, author: pick(db.users).username, rating: rint(1, 5), text: pick(revTexts) });
  }

  const statuses = ['placed', 'preparing', 'delivering', 'fulfilled', 'cancelled'];
  for (let i = 0; i < 40; i++) {
    const u = pick(db.users), it = pick(db.items), qty = rint(1, 4);
    db.orders.push({
      id: nid('order'), userId: u.id, lines: [{ itemId: it.id, qty, optionIds: [] }],
      total: Math.round(it.price * qty * 100) / 100, status: pick(statuses),
      createdAt: new Date(Date.now() - rint(0, 20) * 86400000).toISOString(),
      cardLast4: '4242', trackingCode: 'TRK-' + rint(100000, 999999)
    });
  }

  for (let i = 1; i <= 10; i++) db.giftcards.push({ code: 'GC-' + String(i).padStart(6, '0'), balance: pick([10, 15, 20, 25, 50]), ownerId: pick(db.users).id });
  db.coupons.push(
    { code: 'SAVE10', percent: 10, active: true }, { code: 'HALF', percent: 50, active: true },
    { code: 'VIP20', percent: 20, active: true }, { code: 'BLKFRI', percent: 35, active: false }
  );
  [['delivery', 'How long does delivery take?', 'Most orders arrive within 3–5 business days.'],
   ['returns', 'What is the returns policy?', 'Unopened items can be returned within 30 days.'],
   ['giftcards', 'How do gift cards work?', 'Buy a gift card and redeem the code at checkout.'],
   ['payment', 'Which cards do you accept?', 'All major cards, via our mock gateway.'],
   ['tracking', 'How do I track my order?', 'Open the Orders page — status updates automatically.'],
   ['referral', 'How does the referral bonus work?', 'Invite a friend and earn $3 credit once they buy.'],
   ['account', 'How do I change my address?', 'Update it any time on the Profile page.'],
   ['security', 'Is my data safe?', 'We take security very seriously.']
  ].forEach(([slug, q, a]) => db.articles.push({ id: nid('article'), slug, question: q, answer: a }));
}
seed();

export function findItem(id) { return db.items.find((i) => i.id === id); }
export function findUser(id) { return db.users.find((u) => u.id === id); }
export function newCart() { const id = nid('cart'); const c = { id, lines: [] }; db.carts.set(id, c); return c; }

export function lineTotal(line) {
  const it = findItem(line.itemId);
  if (!it) return 0;
  // VULN[option-price-abuse]: options summed with no dedupe / single-select / floor.
  const delta = (line.optionIds || []).reduce((t, oid) => { const o = db.optionsById.get(oid); return t + (o ? o.priceDelta : 0); }, 0);
  return Math.round((it.price + delta) * line.qty * 100) / 100;
}
export function cartTotal(c) { return Math.round(c.lines.reduce((t, l) => t + lineTotal(l), 0) * 100) / 100; }

export function scheduleOrder(order) {
  const ms = (60 + Math.floor(Math.random() * 240)) * 1000;
  setTimeout(() => { order.status = Math.random() < 0.5 ? 'fulfilled' : 'cancelled'; }, ms);
}
