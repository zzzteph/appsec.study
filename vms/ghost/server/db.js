export const db = { users: [], inventory: [], orders: [] };
const ids = { inv: 1, ord: 1 };
export const nid = (k) => String(ids[k]++);

const CUSTOMERS = ['Jordan', 'Sam', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Alex', 'Quinn', 'Parker', 'Rowan'];

function mkOrder(shopId, item, qty, status) {
  const o = {
    id: nid('ord'), shopId, itemName: item.name, qty, unitPrice: item.price,
    total: Math.round(item.price * qty * 100) / 100, status: status || 'pending',
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)], createdAt: new Date().toISOString()
  };
  db.orders.push(o);
  return o;
}

function seed() {
  db.users.push(
    { id: 'demo', username: 'demo', password: 'demo', shopName: 'Demo Deli' },
    { id: 'alice', username: 'alice', password: 'alice', shopName: 'Alice Autos' },
    { id: 'bob', username: 'bob', password: 'bob', shopName: 'Bob Books' },
    { id: 'carol', username: 'carol', password: 'carol', shopName: 'Carol Crafts' }
  );
  const inv = {
    demo: [['Bagel', 40, 1.5], ['Coffee', 100, 2.5], ['Muffin', 30, 2.0], ['Sandwich', 25, 6.0]],
    alice: [['Oil Filter', 20, 12.0], ['Wiper Blade', 50, 9.5], ['Spark Plug', 80, 4.0], ['Brake Pad', 30, 24.0]],
    bob: [['Sci-Fi Novel', 15, 14.0], ['Notebook', 60, 5.0], ['Pen Set', 40, 8.0], ['Bookmark', 200, 1.0]],
    carol: [['Yarn Ball', 70, 6.0], ['Knitting Needles', 25, 11.0], ['Craft Glue', 90, 3.5], ['Fabric Roll', 40, 15.0]]
  };
  for (const [shopId, items] of Object.entries(inv)) {
    items.forEach(([name, qty, price]) => db.inventory.push({ id: nid('inv'), shopId, name, qty, price }));
  }
  for (const u of db.users) {
    const items = db.inventory.filter((i) => i.shopId === u.id);
    ['delivered', 'delivered', 'delivering', 'approved', 'pending', 'declined'].forEach((st, i) => {
      mkOrder(u.id, items[i % items.length], 1 + Math.floor(Math.random() * 4), st);
    });
  }
}
seed();

// Orders arrive randomly for whatever's in stock.
setInterval(() => {
  const inStock = db.inventory.filter((i) => i.qty > 0);
  if (inStock.length) mkOrder(inStock[Math.floor(Math.random() * inStock.length)].shopId, inStock[Math.floor(Math.random() * inStock.length)], 1 + Math.floor(Math.random() * 3), 'pending');
}, 20000);

export function findOrder(id) { return db.orders.find((o) => o.id === id); }
export function findInv(id) { return db.inventory.find((i) => i.id === id); }
export function findUser(id) { return db.users.find((u) => u.id === id); }
