const Database = require('better-sqlite3')
const crypto = require('crypto')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')
db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, hash_algo TEXT, role TEXT, name TEXT, email TEXT, phone TEXT, tier TEXT );
CREATE TABLE rooms ( id INTEGER PRIMARY KEY, code TEXT, name TEXT, kind TEXT, sleeps INTEGER, price INTEGER, blurb TEXT );
CREATE TABLE reservations ( id INTEGER PRIMARY KEY, user_id INTEGER, room_id INTEGER, checkin TEXT, checkout TEXT, guests INTEGER, status TEXT, card_last4 TEXT, total INTEGER );
CREATE TABLE reviews ( id INTEGER PRIMARY KEY, room_id INTEGER, author TEXT, stars INTEGER, body TEXT, created TEXT );
CREATE TABLE inbox ( id INTEGER PRIMARY KEY, user_id INTEGER, subject TEXT, body TEXT, created TEXT );
`)
const users = [
  // username, password, algo, role, name, email, phone, tier
  ['demo', 'demo', 'plain', 'guest', 'Demo Guest', 'demo@frontdesk.test', '+1-555-0100', 'Silver'],
  ['alice', 'alicehotel', 'plain', 'guest', 'Alice Nguyen', 'alice.nguyen@mail.test', '+1-555-0142', 'Gold'],
  ['bob', 'bobhotel', 'plain', 'guest', 'Bob Carter', 'bob.carter@mail.test', '+1-555-0177', 'Silver'],
  ['manager', md5('frontdesk!'), 'md5', 'admin', 'Site Manager', 'manager@frontdesk.test', '+1-555-0000', 'Staff'],
]
users.forEach((u, i) => db.prepare('INSERT INTO users(id,username,password,hash_algo,role,name,email,phone,tier) VALUES (?,?,?,?,?,?,?,?,?)').run(i + 1, ...u))
const rooms = [
  ['DLX', 'Deluxe King', 'room', 2, 189, 'Plush king bed, city view, rainfall shower, 32 sqm.'],
  ['TWN', 'Classic Twin', 'room', 2, 149, 'Two cosy singles, garden view, ideal for friends.'],
  ['STE', 'Executive Suite', 'suite', 3, 349, 'Separate lounge, espresso bar, lounge access.'],
  ['FAM', 'Family Room', 'room', 4, 259, 'Sofa bed and connecting option, kids stay free.'],
  ['PENT', 'Penthouse', 'suite', 4, 899, 'Top-floor terrace, private butler, skyline plunge pool.'],
  ['STD', 'Standard Queen', 'room', 2, 119, 'Comfortable queen, work desk, quiet wing.'],
]
rooms.forEach((r, i) => db.prepare('INSERT INTO rooms(id,code,name,kind,sleeps,price,blurb) VALUES (?,?,?,?,?,?,?)').run(i + 1, ...r))
const resv = [
  [2, 5, '2024-08-14', '2024-08-18', 2, 'confirmed', '4471', 3596],   // alice -> Penthouse, sensitive
  [2, 3, '2024-11-02', '2024-11-04', 1, 'confirmed', '4471', 698],
  [3, 1, '2024-09-01', '2024-09-03', 2, 'confirmed', '8802', 378],    // bob
  [1, 6, '2024-08-20', '2024-08-22', 1, 'confirmed', '1000', 238],    // demo
]
resv.forEach((r, i) => db.prepare('INSERT INTO reservations(id,user_id,room_id,checkin,checkout,guests,status,card_last4,total) VALUES (?,?,?,?,?,?,?,?,?)').run(i + 1, ...r))
const reviews = [
  [1, 'Priya S.', 5, 'Spotless room and the staff upgraded us. Would return!', '2024-06-11'],
  [1, 'Marco L.', 4, 'Great location, walls a touch thin but slept fine.', '2024-06-20'],
  [3, 'Dana K.', 5, 'The suite espresso bar made my mornings.', '2024-07-01'],
  [5, 'Guest', 5, 'Penthouse terrace at sunset is unreal.', '2024-07-08'],
]
reviews.forEach((r, i) => db.prepare('INSERT INTO reviews(id,room_id,author,stars,body,created) VALUES (?,?,?,?,?,?)').run(i + 1, ...r))
db.prepare("INSERT INTO inbox(id,user_id,subject,body,created) VALUES (1,2,'Welcome to FrontDesk','Thanks for joining our loyalty programme, Alice.','2024-05-01')").run()
module.exports = { db, md5 }
