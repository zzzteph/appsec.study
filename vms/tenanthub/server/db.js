// TenantHub data model + deterministic seed (in-memory SQLite, rebuilt each
// boot). Real SQLite so the search SQLi (V6) is UNION-dumpable. Multi-tenant:
// data belongs to an org; the planted bugs are failures to scope by org/role.
const Database = require('better-sqlite3')
const crypto = require('crypto')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE orgs ( id INTEGER PRIMARY KEY, name TEXT, slug TEXT, plan TEXT, created TEXT );
CREATE TABLE users (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT,
  hash_algo TEXT, name TEXT, avatar_seed TEXT, platform_role TEXT, created TEXT
);
CREATE TABLE memberships ( id INTEGER PRIMARY KEY, org_id INTEGER, user_id INTEGER, role TEXT, created TEXT );
CREATE TABLE projects (
  id INTEGER PRIMARY KEY, org_id INTEGER, name TEXT, description TEXT, owner_id INTEGER,
  automation_template TEXT, created TEXT
);
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY, org_id INTEGER, project_id INTEGER, title TEXT, body TEXT,
  status TEXT, priority TEXT, reporter_id INTEGER, created TEXT
);
CREATE TABLE comments ( id INTEGER PRIMARY KEY, ticket_id INTEGER, org_id INTEGER, author_id INTEGER, author_name TEXT, body TEXT, created TEXT );
CREATE TABLE attachments ( id INTEGER PRIMARY KEY, org_id INTEGER, ticket_id INTEGER, filename TEXT, path TEXT, created TEXT );
CREATE TABLE invites ( id INTEGER PRIMARY KEY, org_id INTEGER, email TEXT, token TEXT, role TEXT, used INTEGER, created TEXT );
CREATE TABLE api_tokens ( id INTEGER PRIMARY KEY, org_id INTEGER, name TEXT, token TEXT, created TEXT );
CREATE TABLE invoices ( id INTEGER PRIMARY KEY, org_id INTEGER, amount REAL, period TEXT, status TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, org_id INTEGER, author TEXT, note TEXT, created TEXT );
CREATE TABLE audit ( id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
`)

// ---- orgs --------------------------------------------------------------------
;[['Acme Inc', 'acme', 'pro'], ['Globex Corp', 'globex', 'enterprise'], ['Initech', 'initech', 'free']]
  .forEach(o => db.prepare('INSERT INTO orgs(name,slug,plan,created) VALUES (?,?,?,?)').run(o[0], o[1], o[2], '2023-06-01'))

// ---- users -------------------------------------------------------------------
// [username,email,plain,algo,name,platform_role]
const U = [
  ['demo',       'demo@tenanthub.test', 'demo',      'bcrypt', 'Demo User',      'user'],
  ['alice.pm',   'alice@acme.test',     'Acme!Pm22', 'bcrypt', 'Alice Turner',   'user'],
  ['bob.admin',  'bob@globex.test',     'welcome1',  'md5',    'Bob Chen',       'user'],
  ['carol.ceo',  'carol@globex.test',   'Gl0bexC3O!','bcrypt', 'Carol Reyes',    'user'],
  ['dave.dev',   'dave@initech.test',   'davedev01', 'bcrypt', 'Dave Kumar',     'user'],
  ['root',       'root@tenanthub.test', 'R00t#Plat!x','bcrypt','Platform Admin', 'superadmin'],
]
const insU = db.prepare(`INSERT INTO users(id,uuid,username,email,password,hash_algo,name,avatar_seed,platform_role,created)
  VALUES (?,?,?,?,?,?,?,?,?,?)`)
U.forEach((r, i) => {
  const id = i + 1
  insU.run(id, 'usr_' + id, r[0], r[1], r[3] === 'md5' ? md5(r[2]) : bcryptHash(r[2]), r[3], r[4], r[0], r[5], '2023-06-01')
})

// ---- memberships (org_id, user_id, role) ------------------------------------
;[
  [1, 1, 'member'], [1, 2, 'owner'],       // Acme: demo=member, alice=owner
  [2, 3, 'admin'], [2, 4, 'owner'],        // Globex: bob=admin, carol=owner
  [3, 5, 'member'],                        // Initech: dave=member
].forEach(m => db.prepare('INSERT INTO memberships(org_id,user_id,role,created) VALUES (?,?,?,?)').run(m[0], m[1], m[2], '2023-06-01'))

// ---- projects (automation_template is the SSTI sink, V8) ---------------------
const insP = db.prepare('INSERT INTO projects(org_id,name,description,owner_id,automation_template,created) VALUES (?,?,?,?,?,?)')
;[
  [1, 'Website Redesign', 'Marketing site refresh for Q3.', 2, 'Ticket {{ title }} moved to {{ status }}.'],
  [2, 'Project Titan', 'CONFIDENTIAL — next-gen platform, unreleased.', 4, 'Notify {{ assignee }}: {{ title }}.'],
  [2, 'M&A Due Diligence', 'RESTRICTED — acquisition target financials.', 4, 'Deal update: {{ title }}.'],
  [3, 'Internal Tools', 'Ops automation scripts.', 5, 'Build {{ title }} — {{ status }}.'],
].forEach(p => insP.run(p[0], p[1], p[2], p[3], p[4], '2023-07-01'))

// ---- tickets -----------------------------------------------------------------
const insT = db.prepare('INSERT INTO tickets(org_id,project_id,title,body,status,priority,reporter_id,created) VALUES (?,?,?,?,?,?,?,?)')
;[
  [1, 1, 'Update hero section', 'Refresh the homepage hero copy and image.', 'open', 'normal', 1],
  [1, 1, 'Fix mobile nav', 'Menu overlaps on small screens.', 'in_progress', 'high', 2],
  [2, 2, 'Titan API keys rotation', 'Rotate prod API keys before launch. Keys in vault note.', 'open', 'critical', 4],
  [2, 3, 'NDA counterparties list', 'Confidential list of acquisition targets attached.', 'open', 'critical', 4],
  [3, 4, 'CI pipeline flaky', 'Intermittent failures on deploy step.', 'open', 'normal', 5],
].forEach(t => insT.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6], '2024-05-01'))

// ---- comments (benign; stored-XSS lands here at runtime, V7) -----------------
const insCm = db.prepare('INSERT INTO comments(ticket_id,org_id,author_id,author_name,body,created) VALUES (?,?,?,?,?,?)')
;[[1, 1, 2, 'Alice Turner', 'On it — draft ready tomorrow.'], [3, 2, 4, 'Carol Reyes', 'Rotate before Friday please.']]
  .forEach(c => insCm.run(c[0], c[1], c[2], c[3], c[4], '2024-05-02'))

// ---- attachments (path used by the export/download traversal, V9) -----------
db.prepare("INSERT INTO attachments(org_id,ticket_id,filename,path,created) VALUES (2,4,'targets.csv','project-export-sample.json','2024-05-01')").run()

// ---- invites (role-tamperable + reusable, V3) -------------------------------
db.prepare("INSERT INTO invites(org_id,email,token,role,used,created) VALUES (1,'newhire@acme.test',?, 'member',0,'2024-05-10')").run(crypto.createHash('sha1').update('acme-invite-seed').digest('hex').slice(0, 24))

// ---- api tokens (org secret, IDOR target V5) --------------------------------
;[[1, 'CI token', 'thk_acme_' + 'a1b2c3d4e5'], [2, 'Prod integration', 'thk_globex_' + 'z9y8x7w6v5']]
  .forEach(t => db.prepare('INSERT INTO api_tokens(org_id,name,token,created) VALUES (?,?,?,?)').run(t[0], t[1], t[2], '2024-01-01'))

// ---- invoices ----------------------------------------------------------------
;[[1, 290, '2024-05', 'paid'], [2, 4900, '2024-05', 'paid'], [3, 0, '2024-05', 'free']]
  .forEach(v => db.prepare('INSERT INTO invoices(org_id,amount,period,status,created) VALUES (?,?,?,?,?)').run(v[0], v[1], v[2], v[3], '2024-06-01'))

db.prepare(`INSERT INTO staff_notes(org_id,author,note,created) VALUES
  (0,'root','Project automation templates render server-side in the admin panel. Rotate config/app.secret before the SOC2 audit.','2024-01-02')`).run()
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('root','config.update','notification_template updated','2024-01-03')").run()
;[['product', 'TenantHub'], ['notification_template', 'Hi {{ name }}, there is an update in {{ project }}.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
