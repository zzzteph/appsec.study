// Meridian ID data model + deterministic seed (in-memory SQLite, rebuilt each
// boot). Real SQLite so the user-search SQLi (V13) is UNION-dumpable.
const Database = require('better-sqlite3')
const { bcryptHash, md5, SECRET } = require('./auth')

const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT,
  hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, email_verified INTEGER,
  mfa_enabled INTEGER, department TEXT, created TEXT
);
CREATE TABLE clients (
  client_id TEXT PRIMARY KEY, client_secret TEXT, name TEXT, redirect_uris TEXT,
  allowed_scopes TEXT, owner_id INTEGER, logo TEXT, created TEXT
);
CREATE TABLE codes (
  code TEXT PRIMARY KEY, client_id TEXT, user_id INTEGER, redirect_uri TEXT,
  scope TEXT, state TEXT, used INTEGER, created TEXT
);
CREATE TABLE tokens (
  access_token TEXT PRIMARY KEY, user_id INTEGER, client_id TEXT, scope TEXT, created TEXT
);
CREATE TABLE consents (
  id INTEGER PRIMARY KEY, user_id INTEGER, client_id TEXT, scope TEXT, created TEXT
);
CREATE TABLE catch_log ( id INTEGER PRIMARY KEY, data TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, user_id INTEGER, author TEXT, note TEXT, created TEXT );
CREATE TABLE audit ( id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT );
CREATE TABLE rp_docs ( id INTEGER PRIMARY KEY, owner_email TEXT, title TEXT, body TEXT, created TEXT );
CREATE TABLE rp_products ( id INTEGER PRIMARY KEY, name TEXT, price REAL );
`)

// ---- users -------------------------------------------------------------------
// [username, email, plain, algo, role, name, verified, dept]
const U = [
  ['demo',        'demo@meridian.id',       'demo',            'bcrypt', 'user',  'Demo User',   1, 'Guest'],
  ['alice.wong',  'alice.wong@acme.test',   'Sunflower22',     'bcrypt', 'user',  'Alice Wong',  1, 'Engineering'],
  ['bob.smith',   'bob.smith@acme.test',    'bobseason1',      'bcrypt', 'user',  'Bob Smith',   1, 'Sales'],
  ['carol.jones', 'carol.jones@acme.test',  'caroljones',      'bcrypt', 'user',  'Carol Jones', 1, 'Finance'],
  ['dave.lee',    'dave.lee@globex.test',   'davelee123',      'bcrypt', 'user',  'Dave Lee',    1, 'Support'],
  ['eve.martin',  'eve.martin@globex.test', 'evemartin7',      'bcrypt', 'user',  'Eve Martin',  0, 'Marketing'],
  ['admin',       'admin@meridian.id',      'dragon123',       'md5',    'admin', 'Site Admin',  1, 'IT'],
  ['sysops',      'sysops@meridian.id',     'S3cur3Ops!x9Q',   'bcrypt', 'admin', 'SysOps',      1, 'IT'],
]
const insU = db.prepare(`INSERT INTO users
  (id,uuid,username,email,password,hash_algo,role,name,avatar_seed,email_verified,mfa_enabled,department,created)
  VALUES (@id,@uuid,@username,@email,@password,@algo,@role,@name,@seed,@verified,@mfa,@dept,@created)`)
U.forEach((r, i) => {
  const id = i + 1
  const [username, email, plain, algo, role, name, verified, dept] = r
  insU.run({
    id, uuid: `usr_${String(id).padStart(4, '0')}`, username, email,
    password: algo === 'md5' ? md5(plain) : bcryptHash(plain), algo, role, name,
    seed: username, verified, mfa: role === 'admin' ? 1 : 0, dept, created: '2024-0' + ((id % 8) + 1) + '-10T09:00:00Z',
  })
})

// ---- clients -----------------------------------------------------------------
const C = [
  ['docs-app', 'docs_9f2a_secret',   'Meridian Docs',    '/apps/docs/callback',  'openid profile email',       7, 'docs'],
  ['shop-app', 'shop_7b1c_secret',   'Meridian Shop',    '/apps/shop/callback',  'openid profile email',       7, 'shop'],
  ['console',  'console_admin_9x7z', 'Meridian Console', '/admin/callback',      'openid profile email admin', 7, 'console'],
]
const insC = db.prepare('INSERT INTO clients(client_id,client_secret,name,redirect_uris,allowed_scopes,owner_id,logo,created) VALUES (?,?,?,?,?,?,?,?)')
C.forEach(c => insC.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], '2024-01-05T09:00:00Z'))

// ---- consents (existing app authorizations, for realism + IDOR target) ------
const insCon = db.prepare('INSERT INTO consents(user_id,client_id,scope,created) VALUES (?,?,?,?)')
;[[2, 'docs-app', 'openid profile email'], [2, 'shop-app', 'openid profile email'], [3, 'docs-app', 'openid profile email'], [1, 'docs-app', 'openid profile email']]
  .forEach(x => insCon.run(x[0], x[1], x[2], '2024-04-01T10:00:00Z'))

// ---- config (jwt_signing_key is the V13/V14 leak -> V5 forge) ----------------
;[
  ['issuer', 'https://meridian.id'],
  ['org_name', 'Meridian'],
  ['jwt_signing_key', SECRET],
  ['jwt_alg', 'HS256'],
  ['branding_template', 'Sign in to {{ org }} — secure single sign-on for your team.'],
  ['welcome_email_template', 'Hi {{ name }}, welcome to Meridian. Your account for {{ email }} is ready.'],
  ['debug', 'false'],
].forEach(([k, v]) => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(k, v))

db.prepare(`INSERT INTO staff_notes(user_id,author,note,created) VALUES
  (0,'sysops','Signing key lives in config.jwt_signing_key — rotate before GA. Branding template renders live on the login page.','2024-01-06T09:00:00Z')`).run()
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('sysops','client.create','registered console','2024-01-05T09:00:00Z')").run()

// ---- relying-party content (Docs keyed by EMAIL -> V7 email-identity ATO) ----
const insD = db.prepare('INSERT INTO rp_docs(owner_email,title,body,created) VALUES (?,?,?,?)')
;[
  ['alice.wong@acme.test', 'Q3 Architecture', 'Internal design notes for the Q3 platform migration.'],
  ['alice.wong@acme.test', 'On-call runbook', 'Steps for the primary on-call engineer.'],
  ['bob.smith@acme.test', 'Sales pipeline', 'Confidential deal pipeline and forecasts.'],
  ['carol.jones@acme.test', 'Budget 2024', 'Finance budget workbook and headcount plan.'],
].forEach(d => insD.run(d[0], d[1], d[2], '2024-03-01T10:00:00Z'))
;[['Pro Plan (annual)', 199], ['Team Seat', 12], ['Enterprise SSO Add-on', 499]].forEach(p => db.prepare('INSERT INTO rp_products(name,price) VALUES (?,?)').run(p))

module.exports = { db }
