// Northwind Bank data model + deterministic seed (in-memory SQLite, rebuilt each
// boot). Real SQLite so the transaction-search SQLi (V10) is UNION-dumpable.
const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE customers (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT,
  hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, phone TEXT, dob TEXT, address TEXT,
  kyc_status TEXT, tier TEXT, daily_limit REAL, twofa_enabled INTEGER, twofa_secret TEXT, created TEXT
);
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY, customer_id INTEGER, type TEXT, number TEXT, balance REAL,
  currency TEXT, status TEXT, opened TEXT
);
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY, account_id INTEGER, kind TEXT, amount REAL, balance_after REAL,
  memo TEXT, counterparty TEXT, created TEXT
);
CREATE TABLE transfers (
  id INTEGER PRIMARY KEY, from_account INTEGER, to_account INTEGER, amount REAL, memo TEXT, status TEXT, created TEXT
);
CREATE TABLE payees (
  id INTEGER PRIMARY KEY, customer_id INTEGER, name TEXT, account_number TEXT, bank TEXT, created TEXT
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY, customer_id INTEGER, folder TEXT, subject TEXT, body TEXT,
  is_system INTEGER, reset_token TEXT, read INTEGER, created TEXT
);
CREATE TABLE password_resets ( id INTEGER PRIMARY KEY, customer_id INTEGER, token TEXT, expires TEXT, used INTEGER );
CREATE TABLE statements ( id INTEGER PRIMARY KEY, customer_id INTEGER, account_id INTEGER, period TEXT, filename TEXT, created TEXT );
CREATE TABLE tickets ( id INTEGER PRIMARY KEY, customer_id INTEGER, subject TEXT, body TEXT, status TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, customer_id INTEGER, author TEXT, note TEXT, created TEXT );
CREATE TABLE audit ( id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
`)

// ---- customers ---------------------------------------------------------------
// [username,email,plain,algo,role,name,phone,dob,address,kyc,tier,limit]
const C = [
  ['demo',          'demo@northwind.test',       'demo',          'bcrypt', 'customer', 'Demo Customer', '+1-555-0100', '1993-04-12', '14 Oak St, Springfield',   'verified', 'standard', 2000],
  ['alice.johnson', 'alice.johnson@mail.test',   'Springtime1',   'bcrypt', 'customer', 'Alice Johnson', '+1-555-0142', '1987-09-03', '88 Maple Ave, Rivertown',  'verified', 'premium',  10000],
  ['bob.williams',  'bob.williams@mail.test',    'bobby2020',     'bcrypt', 'customer', 'Bob Williams',  '+1-555-0173', '1990-12-19', '5 Pine Rd, Lakeside',      'verified', 'standard', 2000],
  ['carol.davis',   'carol.davis@mail.test',     'caroldavis',    'bcrypt', 'customer', 'Carol Davis',   '+1-555-0198', '1995-06-25', '27 Birch Ln, Hillcrest',   'pending',  'standard', 1000],
  ['dan.miller',    'dan.miller@mail.test',      'danmiller7',    'bcrypt', 'customer', 'Dan Miller',    '+1-555-0211', '1982-02-08', '9 Cedar St, Fairview',     'verified', 'premium',  15000],
  ['grace.kim',     'grace.kim@northgroup.test', 'GraceKim$$88',  'bcrypt', 'customer', 'Grace Kim',     '+1-555-0240', '1978-11-30', '400 Summit Blvd, Downtown','verified', 'business', 50000],
  ['emma.stone',    'emma.stone@northwind.test', 'butterfly',     'md5',    'staff',    'Emma Stone',    '+1-555-0300', '1991-07-16', 'Northwind HQ',             'verified', 'staff',    0],
  ['ops.admin',     'ops@northwind.test',        'N0rthW!nd#Ops', 'bcrypt', 'admin',    'Operations',    '+1-555-0301', '1980-01-01', 'Northwind HQ',             'verified', 'admin',    0],
]
const insC = db.prepare(`INSERT INTO customers
  (id,uuid,username,email,password,hash_algo,role,name,avatar_seed,phone,dob,address,kyc_status,tier,daily_limit,twofa_enabled,twofa_secret,created)
  VALUES (@id,@uuid,@username,@email,@password,@algo,@role,@name,@seed,@phone,@dob,@address,@kyc,@tier,@limit,@mfa,'JBSWY3DPEHPK3PXP',@created)`)
C.forEach((r, i) => {
  const id = i + 1
  const [username, email, plain, algo, role, name, phone, dob, address, kyc, tier, limit] = r
  insC.run({
    id, uuid: `cust_${String(id).padStart(4, '0')}`, username, email,
    password: algo === 'md5' ? md5(plain) : bcryptHash(plain), algo, role, name, seed: username,
    phone, dob, address, kyc, tier, limit, mfa: ['alice.johnson', 'grace.kim', 'ops.admin'].includes(username) ? 1 : 0,
    created: '2023-0' + ((id % 8) + 1) + '-15T09:00:00Z',
  })
})

// ---- accounts (sequential ids = IDOR surface) --------------------------------
const insA = db.prepare('INSERT INTO accounts(customer_id,type,number,balance,currency,status,opened) VALUES (?,?,?,?,?,?,?)')
const A = [
  [1, 'checking', '****4021', 1240.55], [1, 'savings', '****4022', 300.00],
  [2, 'checking', '****5133', 8450.00], [2, 'savings', '****5134', 12000.00],
  [3, 'checking', '****6210', 2300.00],
  [4, 'checking', '****6790', 540.25],
  [5, 'checking', '****7355', 17800.00], [5, 'savings', '****7356', 40000.00],
  [6, 'checking', '****9001', 95000.00], [6, 'savings', '****9002', 250000.00],
]
A.forEach(a => insA.run(a[0], a[1], a[2], a[3], 'USD', 'active', '2023-02-01'))

// ---- transactions (history + SQLi base rows) --------------------------------
const insT = db.prepare('INSERT INTO transactions(account_id,kind,amount,balance_after,memo,counterparty,created) VALUES (?,?,?,?,?,?,?)')
;[
  [1, 'debit', -42.30, 1198.25, 'Coffee Roasters', 'Coffee Roasters', '2024-05-04'],
  [1, 'credit', 900.00, 2098.25, 'Payroll ACME Inc', 'ACME Inc', '2024-05-15'],
  [1, 'debit', -857.70, 1240.55, 'Rent payment', 'Landlord LLC', '2024-05-16'],
  [2, 'credit', 300.00, 300.00, 'Transfer from checking', 'self', '2024-05-01'],
  [3, 'debit', -120.00, 8330.00, 'Grocery', 'FreshMart', '2024-05-10'],
  [3, 'credit', 120.00, 8450.00, 'Refund', 'FreshMart', '2024-05-12'],
  [9, 'credit', 50000.00, 95000.00, 'Wire in — NorthGroup', 'NorthGroup Ltd', '2024-04-20'],
].forEach(t => insT.run(t))

// ---- payees / beneficiaries (IDOR target, V3) -------------------------------
const insP = db.prepare('INSERT INTO payees(customer_id,name,account_number,bank,created) VALUES (?,?,?,?,?)')
;[
  [1, 'Landlord LLC', '****8890', 'First National'], [1, 'Mom', '****2231', 'Northwind'],
  [2, 'Home Renovations Inc', '****4410', 'Metro Bank'], [5, 'Investment Fund', '****7788', 'Vanguard'],
].forEach(p => insP.run(p[0], p[1], p[2], p[3], '2024-01-01'))

// ---- statements --------------------------------------------------------------
const insS = db.prepare('INSERT INTO statements(customer_id,account_id,period,filename,created) VALUES (?,?,?,?,?)')
;[[1, 1, '2024-05', 'statement-checking-2024-05.txt'], [2, 3, '2024-05', 'statement-checking-2024-05.txt'], [5, 7, '2024-05', 'statement-checking-2024-05.txt']]
  .forEach(s => insS.run(s[0], s[1], s[2], s[3], '2024-06-01'))

// ---- inbox -------------------------------------------------------------------
const insM = db.prepare('INSERT INTO messages(customer_id,folder,subject,body,is_system,reset_token,read,created) VALUES (?,?,?,?,?,?,?,?)')
;[
  [1, 'Welcome to Northwind Bank', 'Your accounts are ready. Manage everything from your dashboard.', 1, 1],
  [1, 'Your May statement is ready', 'Your Everyday Checking statement for May 2024 is available.', 1, 1],
  [2, 'Large deposit received', 'A deposit of $900.00 posted to your account.', 1, 0],
  [7, 'Staff portal access', 'Your Northwind staff back-office access is active. Contact ops@northwind.test for help.', 1, 1],
].forEach(m => insM.run(m[0], 'inbox', m[1], m[2], m[3], null, m[4], '2024-05-20T09:00:00Z'))

// ---- tickets / notes / audit / config ---------------------------------------
db.prepare("INSERT INTO tickets(customer_id,subject,body,status,created) VALUES (1,'Increase my limit','Can I raise my daily transfer limit?','open','2024-05-21')").run()
const insSN = db.prepare('INSERT INTO staff_notes(customer_id,author,note,created) VALUES (?,?,?,?)')
;[
  [6, 'emma.stone', 'Business VIP — expedite wires, no manual hold.', '2024-04-01'],
  [0, 'ops.admin', 'Reminder: statement/report templates render live in the back-office. Rotate config/app.secret before audit.', '2024-01-02'],
].forEach(n => insSN.run(n))
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('ops.admin','config.update','report_template updated','2024-01-03')").run()
;[
  ['bank_name', 'Northwind Bank'], ['min_transfer', '1'], ['support_email', 'support@northwind.bank'],
  ['report_template', 'Statement for {{ name }} — closing balance {{ balance }} USD.'],
].forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
