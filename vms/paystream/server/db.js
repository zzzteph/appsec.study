// Paystream data model + deterministic seed (in-memory SQLite). Real SQLite so
// the employee-search SQLi (V6) is UNION-dumpable. Employees carry sensitive PII
// (salary/SSN/bank) — the IDOR planted here is a mass-exfiltration bug.
const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE employees (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT, hash_algo TEXT,
  role TEXT, name TEXT, avatar_seed TEXT, title TEXT, department TEXT, manager_id INTEGER,
  salary REAL, ssn TEXT, bank_account TEXT, address TEXT, created TEXT
);
CREATE TABLE payslips ( id INTEGER PRIMARY KEY, employee_id INTEGER, period TEXT, gross REAL, tax REAL, net REAL, filename TEXT );
CREATE TABLE expenses ( id INTEGER PRIMARY KEY, employee_id INTEGER, amount REAL, category TEXT, memo TEXT, status TEXT, approver_id INTEGER, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, author TEXT, note TEXT, created TEXT );
`)

// employees [username,email,plain,algo,role,name,title,dept,manager_id,salary,ssn,bank]
const E = [
  ['demo', 'demo@paystream.test', 'demo', 'bcrypt', 'employee', 'Demo Employee', 'Analyst', 'Finance', 5, 75000, '123-45-6789', '****4021'],
  ['alice.t', 'alice@paystream.test', 'Alice!2024', 'bcrypt', 'employee', 'Alice Turner', 'Staff Engineer', 'Engineering', 5, 152000, '221-33-9087', '****5133'],
  ['bob.m', 'bob@paystream.test', 'bobmercer1', 'bcrypt', 'employee', 'Bob Mercer', 'Engineer', 'Engineering', 5, 118000, '318-22-4410', '****6210'],
  ['carol.d', 'carol@paystream.test', 'caroldiaz', 'bcrypt', 'employee', 'Carol Diaz', 'Ops Lead', 'Operations', 5, 99000, '405-11-7788', '****6790'],
  ['mgr.mike', 'mike@paystream.test', 'MikeBoss$$9', 'bcrypt', 'manager', 'Mike Boss', 'Manager', 'Finance', 7, 175000, '500-77-1122', '****7355'],
  ['hradmin', 'hr@paystream.test', 'welcome123', 'md5', 'admin', 'HR Admin', 'HR Systems', 'HR', 7, 135000, '600-88-2233', '****9001'],
  ['root', 'ops@paystream.test', 'P@yStr3am#Ops', 'bcrypt', 'admin', 'Payroll Ops', 'Admin', 'HR', 0, 0, '000-00-0000', '****0000'],
]
const insE = db.prepare(`INSERT INTO employees(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,title,department,manager_id,salary,ssn,bank_account,address,created)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
E.forEach((r, i) => { const id = i + 1; insE.run(id, 'emp_' + (1000 + id), r[0], r[1], r[3] === 'md5' ? md5(r[2]) : bcryptHash(r[2]), r[3], r[4], r[5], r[0], r[6], r[7], r[8], r[9], r[10], r[11], (10 + id) + ' Main St, Metro City', '2022-01-01') })

// payslips (IDOR target)
;[
  [1, '2024-05', 6250, 1480, 4450], [2, '2024-05', 12666, 3800, 8100], [3, '2024-05', 9833, 2600, 6600],
  [4, '2024-05', 8250, 2100, 5600], [5, '2024-05', 14583, 4600, 9200],
].forEach(p => db.prepare('INSERT INTO payslips(employee_id,period,gross,tax,net,filename) VALUES (?,?,?,?,?,?)').run(p[0], p[1], p[2], p[3], p[4], 'payslip-2024-05.txt'))

// expenses (some pending -> workflow-bypass target)
;[
  [1, 240, 'Travel', 'Client visit taxi', 'pending', null], [1, 89, 'Meals', 'Team lunch', 'approved', 5],
  [2, 1200, 'Equipment', 'New laptop', 'pending', null], [3, 340, 'Travel', 'Conference', 'pending', null],
].forEach(x => db.prepare("INSERT INTO expenses(employee_id,amount,category,memo,status,approver_id,created) VALUES (?,?,?,?,?,?, '2024-05-10')").run(x[0], x[1], x[2], x[3], x[4], x[5]))

db.prepare("INSERT INTO staff_notes(author,note,created) VALUES ('root','HR letter templates render server-side in the admin console. Rotate config/app.secret before audit.','2024-01-02')").run()
;[['company', 'Paystream Inc'], ['letter_template', 'Dear {{ name }}, your {{ title }} salary is {{ salary }} USD effective this period.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
