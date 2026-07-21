// In-memory data for the Bytebites food-delivery API (just-eat-inspired).
const users = [
  { id: 1, name: 'Alice Carter', email: 'alice@bytebites.test', phone: '+44 7700 900001', card: '4111********1111', loyalty: 120 },
  { id: 2, name: 'Bob Nguyen', email: 'bob@bytebites.test', phone: '+44 7700 900002', card: '5500********0004', loyalty: 40 },
  { id: 3, name: 'Carol Patel', email: 'carol@bytebites.test', phone: '+44 7700 900003', card: '3782********1000', loyalty: 0 },
]
const addresses = [
  { id: 11, userId: 1, label: 'Home', line1: '221B Baker St', city: 'London', postcode: 'W1U 6TU' },
  { id: 12, userId: 1, label: 'Work', line1: '10 King St', city: 'London', postcode: 'EC2R 8EY' },
  { id: 21, userId: 2, label: 'Home', line1: '5 Queen St', city: 'Manchester', postcode: 'M1 2AB' },
  { id: 31, userId: 3, label: 'Home', line1: '9 Duke St', city: 'Birmingham', postcode: 'B1 1AA' },
]
const restaurants = [
  { id: 101, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.6, deliveryFee: 2.49, menu: [
    { id: 1001, name: 'Margherita', price: 8.5 }, { id: 1002, name: 'Pepperoni', price: 10.0 }, { id: 1003, name: 'Garlic Bread', price: 3.5 } ] },
  { id: 102, name: 'Sushi Central', cuisine: 'Japanese', rating: 4.8, deliveryFee: 3.0, menu: [
    { id: 1101, name: 'Salmon Nigiri (6)', price: 6.0 }, { id: 1102, name: 'Veg Roll (8)', price: 5.0 } ] },
  { id: 103, name: 'Burger Barn', cuisine: 'American', rating: 4.3, deliveryFee: 1.99, menu: [
    { id: 1201, name: 'Cheeseburger', price: 7.5 }, { id: 1202, name: 'Fries', price: 2.5 } ] },
]
// promo codes: applying the SAME code more than once is (deliberately) not prevented → stacks
const promos = { SAVE5: { type: 'fixed', amount: 5 }, WELCOME10: { type: 'percent', amount: 10 } }

const baskets = []   // { id, userId, restaurantId, items:[{menuItemId,name,price,quantity}], promos:[code] }
const orders = [
  { id: 5001, userId: 1, restaurantId: 101, items: [{ name: 'Margherita', price: 8.5, quantity: 1 }], subtotal: 8.5, discount: 0, total: 10.99, status: 'delivered', addressId: 11, refunds: [] },
  { id: 5002, userId: 2, restaurantId: 103, items: [{ name: 'Cheeseburger', price: 7.5, quantity: 2 }], subtotal: 15.0, discount: 0, total: 16.99, status: 'delivered', addressId: 21, refunds: [] },
]
let nextBasket = 9000, nextOrder = 5100

const menuItem = (id) => { for (const r of restaurants) { const m = r.menu.find(m => m.id === Number(id)); if (m) return { ...m, restaurantId: r.id } } return null }

module.exports = {
  users, addresses, restaurants, promos, baskets, orders, menuItem,
  nb: () => ++nextBasket, no: () => ++nextOrder,
}
