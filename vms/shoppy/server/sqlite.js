import Database from 'better-sqlite3';
import { db } from './db.js';

const sql = new Database(':memory:');
sql.exec(`
  CREATE TABLE items (id TEXT, name TEXT, price REAL, description TEXT, category TEXT, shopId TEXT);
  CREATE TABLE reviews (id TEXT, shopId TEXT, author TEXT, rating INTEGER, text TEXT);
`);
const insItem = sql.prepare('INSERT INTO items VALUES (?,?,?,?,?,?)');
for (const i of db.items) insItem.run(i.id, i.name, i.price, i.description, i.category, i.shopId);
const insRev = sql.prepare('INSERT INTO reviews VALUES (?,?,?,?,?)');
for (const r of db.reviews) insRev.run(r.id, r.shopId, r.author, r.rating, r.text);

export function addReviewRow(r) { insRev.run(r.id, r.shopId, r.author, r.rating, r.text); }

// VULN[graphql-sqli]: the GraphQL arg `q` is concatenated straight into SQL.
// `searchItems(q: "' UNION SELECT ...")` / `searchReviews(q: "'")` -> injection,
// and SQLite errors propagate back as GraphQL errors (error-based).
export function rawSearchItems(q) {
  const s = "SELECT id,name,price,description,category,shopId FROM items WHERE name LIKE '%" + q + "%'";
  return sql.prepare(s).all();
}
export function rawSearchReviews(q) {
  const s = "SELECT id,shopId,author,rating,text FROM reviews WHERE text LIKE '%" + q + "%'";
  return sql.prepare(s).all();
}
