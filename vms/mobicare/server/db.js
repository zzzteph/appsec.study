// MobiCare data model + deterministic seed (in-memory SQLite, rebuilt each boot).
// Real SQLite so the usage-search SQLi (V9) is UNION-dumpable.
const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, msisdn TEXT, email TEXT, password TEXT,
  hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, plan TEXT, tier TEXT, data_allowance_gb REAL,
  kyc_status TEXT, twofa_enabled INTEGER, address TEXT, dob TEXT, created TEXT
);
CREATE TABLE lines_ ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, msisdn TEXT, sim_serial TEXT, plan TEXT, status TEXT, activated TEXT );
CREATE TABLE bills ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, line_id INTEGER, period TEXT, amount REAL, status TEXT, filename TEXT, created TEXT );
CREATE TABLE usage_ ( id INTEGER PRIMARY KEY, line_id INTEGER, subscriber_id INTEGER, type TEXT, counterparty TEXT, amount REAL, unit TEXT, created TEXT );
CREATE TABLE plans ( id INTEGER PRIMARY KEY, name TEXT, price REAL, data_gb REAL, descr TEXT );
CREATE TABLE messages ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, folder TEXT, subject TEXT, body TEXT, is_system INTEGER, reset_token TEXT, otp TEXT, read INTEGER, created TEXT );
CREATE TABLE password_resets ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, token TEXT, expires TEXT, used INTEGER );
CREATE TABLE otp_challenges ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, code TEXT, purpose TEXT, used INTEGER, created TEXT );
CREATE TABLE tickets ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, subject TEXT, body TEXT, status TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, subscriber_id INTEGER, author TEXT, note TEXT, created TEXT );
CREATE TABLE audit ( id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
`)

// ---- subscribers -------------------------------------------------------------
// [username,msisdn,email,plain,algo,role,name,plan,tier,data,kyc,address,dob]
const S = [
  ['demo',       '+1-555-0100', 'demo@mobicare.test',       'demo',        'bcrypt', 'subscriber', 'Demo User',    'Unlimited 5G', 'standard', 999, 'verified', '14 Oak St, Springfield',  '1993-04-12'],
  ['alice.k',    '+1-555-0142', 'alice.k@mail.test',        'Spring2024!', 'bcrypt', 'subscriber', 'Alice Keller', 'Family 40GB',  'premium',  40,  'verified', '88 Maple Ave, Rivertown', '1987-09-03'],
  ['bob.m',      '+1-555-0173', 'bob.m@mail.test',          'bobmobile1',  'bcrypt', 'subscriber', 'Bob Mercer',   'Basic 5GB',    'standard', 5,   'verified', '5 Pine Rd, Lakeside',     '1990-12-19'],
  ['carol.d',    '+1-555-0198', 'carol.d@mail.test',        'caroldee',    'bcrypt', 'subscriber', 'Carol Diaz',   'Unlimited 5G', 'standard', 999, 'pending',  '27 Birch Ln, Hillcrest',  '1995-06-25'],
  ['grace.biz',  '+1-555-0240', 'grace@northgroup.test',    'GraceBiz$$9', 'bcrypt', 'subscriber', 'Grace Okoro',  'Business 200GB','business',200, 'verified', '400 Summit Blvd, Downtown','1978-11-30'],
  ['emma.agent', '+1-555-0300', 'emma.agent@mobicare.test', 'shadow',      'md5',    'staff',      'Emma Stone',   'Staff',        'staff',    0,   'verified', 'MobiCare HQ',             '1991-07-16'],
  ['ops.admin',  '+1-555-0301', 'ops@mobicare.test',        'M0biC@re#Ops','bcrypt', 'admin',      'Operations',   'Staff',        'admin',    0,   'verified', 'MobiCare HQ',             '1980-01-01'],
]
const insS = db.prepare(`INSERT INTO subscribers(id,uuid,username,msisdn,email,password,hash_algo,role,name,avatar_seed,plan,tier,data_allowance_gb,kyc_status,twofa_enabled,address,dob,created)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
S.forEach((r, i) => {
  const id = i + 1
  insS.run(id, 'sub_' + String(id).padStart(4, '0'), r[0], r[1], r[2], r[3] === undefined ? '' : (r[4] === 'md5' ? md5(r[3]) : bcryptHash(r[3])), r[4], r[5], r[6], r[0], r[7], r[8], r[9], r[10], ['alice.k', 'grace.biz', 'ops.admin'].includes(r[0]) ? 1 : 0, r[11], r[12], '2022-0' + ((id % 8) + 1) + '-01T09:00:00Z')
})

// ---- lines -------------------------------------------------------------------
const insL = db.prepare('INSERT INTO lines_(subscriber_id,msisdn,sim_serial,plan,status,activated) VALUES (?,?,?,?,?,?)')
S.forEach((r, i) => { const id = i + 1; insL.run(id, r[1], '8901' + String(10000000 + id * 7777), r[6], 'active', '2022-01-01') })

// ---- bills (LFI + IDOR: filename + id) --------------------------------------
const insB = db.prepare('INSERT INTO bills(subscriber_id,line_id,period,amount,status,filename,created) VALUES (?,?,?,?,?,?,?)')
;[[1, 1, '2024-05', 61.20, 'due'], [2, 2, '2024-05', 89.50, 'paid'], [3, 3, '2024-05', 22.00, 'paid'], [5, 5, '2024-05', 240.00, 'paid']]
  .forEach(b => insB.run(b[0], b[1], b[2], b[3], b[4], 'bill-2024-05.txt', '2024-06-01'))

// ---- usage / CDR (sensitive; SQLi base + IDOR) ------------------------------
const insU = db.prepare('INSERT INTO usage_(line_id,subscriber_id,type,counterparty,amount,unit,created) VALUES (?,?,?,?,?,?,?)')
;[
  [1, 1, 'call', '+1-555-0142', 4, 'min', '2024-05-10'], [1, 1, 'data', 'youtube.com', 1.2, 'GB', '2024-05-11'], [1, 1, 'sms', '+1-555-0173', 1, 'msg', '2024-05-12'],
  [2, 2, 'call', '+1-555-0999', 22, 'min', '2024-05-09'], [2, 2, 'call', '+1-800-BANK', 8, 'min', '2024-05-14'],
  [5, 5, 'call', '+1-555-0007', 15, 'min', '2024-05-08'], [5, 5, 'data', 'dropbox.com', 12, 'GB', '2024-05-15'],
].forEach(u => insU.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6]))

// ---- plans (decoy catalog) ---------------------------------------------------
;[['Basic 5GB', 20, 5, '5 GB data, unlimited calls'], ['Family 40GB', 55, 40, '40 GB shared, 4 lines'], ['Unlimited 5G', 45, 999, 'Unlimited 5G data'], ['Business 200GB', 120, 200, 'Priority network, 200 GB']]
  .forEach(p => db.prepare('INSERT INTO plans(name,price,data_gb,descr) VALUES (?,?,?,?)').run(p))

// ---- inbox -------------------------------------------------------------------
const insM = db.prepare('INSERT INTO messages(subscriber_id,folder,subject,body,is_system,reset_token,otp,read,created) VALUES (?,?,?,?,?,?,?,?,?)')
;[
  [1, 'Welcome to MobiCare', 'Your Unlimited 5G line is active. Manage everything from the app.', 1, 1],
  [1, 'Your May bill is ready', 'Your bill of $61.20 is due 15 Jun.', 1, 1],
  [6, 'Agent portal access', 'Your MobiCare back-office agent access is active. Contact ops@mobicare.test for help.', 1, 1],
].forEach(m => insM.run(m[0], 'inbox', m[1], m[2], m[3], null, null, m[4], '2024-05-20T09:00:00Z'))

// ---- notes / audit / config -------------------------------------------------
const insSN = db.prepare('INSERT INTO staff_notes(subscriber_id,author,note,created) VALUES (?,?,?,?)')
;[
  [5, 'emma.agent', 'Business VIP — expedite SIM swaps, no manual hold.', '2024-04-01'],
  [0, 'ops.admin', 'Bill/notification templates render live in the agent console. Rotate config/app.secret before audit.', '2024-01-02'],
].forEach(n => insSN.run(n))
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('ops.admin','config.update','notification_template updated','2024-01-03')").run()
;[['carrier', 'MobiCare'], ['support_email', 'support@mobicare.test'], ['report_template', 'Hi {{ name }}, your {{ plan }} bill is {{ amount }} USD.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
