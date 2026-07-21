// In-memory data for the "MenuForge" partner menu editor. IDs are UUIDs (not enumerable). Two partner
// accounts (test1, test2), each owning one restaurant → menus → items.
const { randomUUID } = require('crypto')

const item = (name, price, o = {}) => ({ id: randomUUID(), name, price, description: o.description || '', section: o.section || 'Mains', allergens: o.allergens || [], available: o.available !== false })
const menu = (name, items, o = {}) => ({ id: randomUUID(), name, description: o.description || '', active: o.active !== false, items })

const restaurants = [
  {
    id: randomUUID(), owner: 'test1', name: 'Trattoria Uno', cuisine: 'Italian', menus: [
      menu('Lunch', [
        item('Margherita', 8.5, { section: 'Pizza', allergens: ['gluten', 'dairy'] }),
        item('Spaghetti Carbonara', 11.0, { section: 'Pasta', allergens: ['gluten', 'egg', 'dairy'] }),
        item('Caprese Salad', 6.5, { section: 'Starters', allergens: ['dairy'] }),
      ]),
      menu('Dinner', [
        item('Osso Buco', 18.0, { section: 'Mains', allergens: [] }),
        item('Tiramisu', 5.5, { section: 'Dessert', allergens: ['gluten', 'egg', 'dairy'] }),
      ]),
    ],
  },
  {
    id: randomUUID(), owner: 'test2', name: 'Sakura Due', cuisine: 'Japanese', menus: [
      menu('Sushi', [
        item('Salmon Nigiri (6)', 7.0, { section: 'Nigiri', allergens: ['fish'] }),
        item('Dragon Roll', 12.5, { section: 'Rolls', allergens: ['fish', 'gluten', 'soy'] }),
      ]),
      menu('Ramen', [
        item('Tonkotsu Ramen', 13.0, { section: 'Ramen', allergens: ['gluten', 'egg', 'soy'] }),
        item('Gyoza (5)', 5.0, { section: 'Sides', allergens: ['gluten', 'soy'] }),
      ]),
      menu('Drinks', [item('Matcha Latte', 3.5, { section: 'Hot' }), item('Ramune', 2.5, { section: 'Cold' })]),
    ],
  },
]

const users = [
  { username: 'test1', password: 'test1', restaurantId: restaurants[0].id },
  { username: 'test2', password: 'test2', restaurantId: restaurants[1].id },
]

// lookups: verify DATA-INTEGRITY (entity exists + belongs to its parent) — NOT ownership by the caller.
const findRestaurant = (rid) => restaurants.find(r => r.id === rid)
const findMenu = (rid, mid) => { const r = findRestaurant(rid); return r ? r.menus.find(m => m.id === mid) : null }
const findItem = (rid, mid, iid) => { const m = findMenu(rid, mid); return m ? m.items.find(i => i.id === iid) : null }

module.exports = { users, restaurants, findRestaurant, findMenu, findItem, mkItem: item, mkMenu: menu, randomUUID }
