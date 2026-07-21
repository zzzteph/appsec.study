// RollHouse data model + deterministic seed.
//
// In-memory SQLite: every boot (incl. the 2h restart) rebuilds an identical,
// known-good world. Real SQLite so the planted SQLi (V10) is genuinely
// UNION-dumpable. Money is a plain RC number so the business-logic tampering
// (negative amounts, client-trusted payouts) is directly observable.
const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')

const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  uuid TEXT UNIQUE,
  username TEXT UNIQUE,
  email TEXT,
  password TEXT,            -- bcrypt for everyone EXCEPT mia.chen (legacy md5, V10)
  hash_algo TEXT,           -- 'bcrypt' | 'md5'
  role TEXT,                -- player | staff | admin
  display_name TEXT,
  avatar_seed TEXT,
  bio TEXT,
  vip_tier TEXT,            -- bronze | silver | gold | diamond
  kyc_status TEXT,          -- none | pending | verified
  wager_met INTEGER,        -- 0/1 (server-authoritative gate, but mutable via V9)
  wager_required REAL,
  wager_progress REAL,
  balance REAL,
  bonus_balance REAL,
  twofa_enabled INTEGER,
  twofa_secret TEXT,
  referral_code TEXT,
  referred_by TEXT,
  client_seed TEXT,
  nonce INTEGER,
  phone TEXT,
  dob TEXT,
  country TEXT,
  created TEXT
);
CREATE TABLE ledger (
  id INTEGER PRIMARY KEY,
  player_id INTEGER,
  kind TEXT,
  amount REAL,
  balance_after REAL,
  ref TEXT,
  created TEXT
);
CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE, name TEXT, category TEXT, provider TEXT,
  rtp REAL, tile TEXT, popular INTEGER, min_bet REAL, max_bet REAL
);
CREATE TABLE bets (
  id INTEGER PRIMARY KEY,
  player_id INTEGER, game_slug TEXT, stake REAL, multiplier REAL,
  payout REAL, status TEXT, nonce INTEGER, created TEXT
);
CREATE TABLE promos (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE, kind TEXT, value REAL, min_deposit REAL,
  single_use INTEGER, active INTEGER, description TEXT
);
CREATE TABLE promo_redemptions (
  id INTEGER PRIMARY KEY, promo_id INTEGER, player_id INTEGER, created TEXT
);
CREATE TABLE bonuses (
  id INTEGER PRIMARY KEY, player_id INTEGER, promo_code TEXT, amount REAL,
  wager_required REAL, wager_done REAL, status TEXT, created TEXT
);
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY, referrer_id INTEGER, referred_email TEXT,
  referred_id INTEGER, bonus REAL, status TEXT, created TEXT
);
CREATE TABLE kyc_docs (
  id INTEGER PRIMARY KEY, doc_uuid TEXT, player_id INTEGER, type TEXT,
  filename TEXT, content TEXT, status TEXT, created TEXT
);
CREATE TABLE messages (
  id INTEGER PRIMARY KEY, player_id INTEGER, folder TEXT, subject TEXT,
  body TEXT, is_system INTEGER, reset_token TEXT, read INTEGER, created TEXT
);
CREATE TABLE password_resets (
  id INTEGER PRIMARY KEY, player_id INTEGER, token TEXT, expires TEXT, used INTEGER
);
CREATE TABLE tips (
  id INTEGER PRIMARY KEY, from_id INTEGER, to_id INTEGER, amount REAL, note TEXT, created TEXT
);
CREATE TABLE chat (
  id INTEGER PRIMARY KEY, player_id INTEGER, username TEXT, message TEXT, created TEXT
);
CREATE TABLE feed (
  id INTEGER PRIMARY KEY, player_id INTEGER, username TEXT, game TEXT,
  amount REAL, note TEXT, created TEXT
);
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY, player_id INTEGER, subject TEXT, body TEXT, status TEXT, created TEXT
);
CREATE TABLE staff_notes (
  id INTEGER PRIMARY KEY, player_id INTEGER, author TEXT, note TEXT, created TEXT
);
CREATE TABLE audit (
  id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT
);
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
`)

// ---- players -----------------------------------------------------------------
// [username, email, plain, algo, role, display, bio, vip, kyc, balance, bonus, country, dob]
const P = [
  ['demo',       'demo@rollhouse.bet',        'demo',            'bcrypt', 'player', 'Demo Player',   'Just here to play a few rounds.',            'bronze',  'none',     47.5,    25,   'US', '1994-05-02'],
  ['highroller', 'a.morgan@mail.test',        'Qwerty!2024',     'bcrypt', 'player', 'Alex Morgan',   'High stakes only.',                          'diamond', 'verified', 12500,   0,    'GB', '1986-11-14'],
  ['lucky7',     'lucky7@mail.test',          'sevenseven',      'bcrypt', 'player', 'Lucky Seven',   'Lucky number 7.',                            'silver',  'pending',  830,     0,    'CA', '1990-01-07'],
  ['whale',      'r.big@mail.test',           'Wh4le$$Money',    'bcrypt', 'player', 'Robert Bigsby', 'VIP whale. Withdrawals only.',               'diamond', 'verified', 98000,   0,    'AE', '1979-03-22'],
  ['mrspin',     'spin@mail.test',            'spintowin1',      'bcrypt', 'player', 'Marco Spinelli','Slots forever.',                             'silver',  'none',     210,     10,   'IT', '1992-08-30'],
  ['goldenace',  'ace@mail.test',             'acehigh99',       'bcrypt', 'player', 'Grace Chen',    'Cards are my game.',                         'gold',    'verified', 4500,    0,    'SG', '1988-12-01'],
  ['betqueen',   'queen@mail.test',           'iamthequeen',     'bcrypt', 'player', 'Nadia Q.',      'Queen of the tables.',                       'gold',    'pending',  1600,    50,   'ES', '1991-06-18'],
  ['jackpotjoe', 'joe@mail.test',             'jackpot777',      'bcrypt', 'player', 'Joe Nkemdirim', 'One day the big one.',                       'bronze',  'none',     75,      0,    'NG', '1996-02-11'],
  ['silentbob',  'bob@mail.test',             'quietquiet',      'bcrypt', 'player', 'Bob True',     '',                                           'bronze',  'none',     320,     0,    'US', '1985-09-09'],
  ['neonNina',   'nina@mail.test',            'neonlights',      'bcrypt', 'player', 'Nina Volkova',  'Neon nights.',                               'silver',  'verified', 2200,    0,    'RU', '1993-04-25'],
  ['diceduke',   'duke@mail.test',            'rolldice22',      'bcrypt', 'player', 'Duke Ellis',    'Dice or nothing.',                           'silver',  'none',     640,     0,    'AU', '1989-07-13'],
  ['slotsally',  'sally@mail.test',           'sallyslots',      'bcrypt', 'player', 'Sally Reed',    'Spin spin spin.',                            'bronze',  'none',     130,     15,   'IE', '1997-10-05'],
  ['cryptoking', 'k.satoshi@mail.test',       'ToTheMoon2024',   'bcrypt', 'player', 'K. Satoshi',    'Crypto deposits only.',                      'diamond', 'verified', 30500,   0,    'JP', '1984-01-30'],
  ['luckylucy',  'lucy@mail.test',            'luckylucy8',      'bcrypt', 'player', 'Lucy Hart',     'Feeling lucky.',                             'silver',  'pending',  990,     0,    'CA', '1995-03-17'],
  ['highstakes', 'stakes@mail.test',          'allinbaby',       'bcrypt', 'player', 'Viktor S.',     'All in, always.',                            'gold',    'verified', 8800,    0,    'DE', '1982-05-28'],
  ['rollmaster', 'master@mail.test',          'masterroll1',     'bcrypt', 'player', 'Omar Farah',    'Rolling since day one.',                     'bronze',  'none',     150,     0,    'MA', '1998-11-02'],
  ['mia.chen',   'mia.chen@rollhouse.bet',    'sunshine1',       'md5',    'staff',  'Mia Chen',      'Promotions & player support.',               'gold',    'verified', 0,       0,    'US', '1990-07-19'],
  ['root',       'ops@rollhouse.bet',         'Rh!Adm1n#2024$xZ','bcrypt', 'admin',  'Site Operator', 'RollHouse operations.',                      'diamond', 'verified', 0,       0,    'US', '1980-01-01'],
]
const UUID = (i) => `p_${String(i).padStart(4, '0')}_${['4a1f','9c2e','7b3d','2e8a','5f6c','1d0b','8a4e','3c7f','6b9d','0e2a','4d5f','7a1c','9f3e','2b8d','5c6a','1e0f','8d4b','3a7c'][i - 1]}`
const insP = db.prepare(`INSERT INTO players
  (id,uuid,username,email,password,hash_algo,role,display_name,avatar_seed,bio,vip_tier,kyc_status,
   wager_met,wager_required,wager_progress,balance,bonus_balance,twofa_enabled,twofa_secret,
   referral_code,referred_by,client_seed,nonce,phone,dob,country,created)
  VALUES (@id,@uuid,@username,@email,@password,@hash_algo,@role,@display_name,@avatar_seed,@bio,@vip_tier,@kyc_status,
   @wager_met,@wager_required,@wager_progress,@balance,@bonus_balance,@twofa_enabled,@twofa_secret,
   @referral_code,@referred_by,@client_seed,@nonce,@phone,@dob,@country,@created)`)

P.forEach((r, idx) => {
  const id = idx + 1
  const [username, email, plain, algo, role, display, bio, vip, kyc, balance, bonus, country, dob] = r
  insP.run({
    id, uuid: UUID(id), username, email,
    password: algo === 'md5' ? md5(plain) : bcryptHash(plain),
    hash_algo: algo, role, display_name: display, avatar_seed: username, bio,
    vip_tier: vip, kyc_status: kyc,
    wager_met: (username === 'demo') ? 0 : 1,
    wager_required: (username === 'demo') ? 500 : 0,
    wager_progress: (username === 'demo') ? 0 : 0,
    balance, bonus_balance: bonus,
    twofa_enabled: ['whale', 'cryptoking', 'root'].includes(username) ? 1 : 0,
    twofa_secret: 'JBSWY3DPEHPK3PXP',
    referral_code: 'RH-' + username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8),
    referred_by: null,
    client_seed: username + '-seed', nonce: 1,
    phone: '+1-555-01' + String(10 + id), dob, country,
    created: '2024-0' + ((id % 8) + 1) + '-1' + (id % 9) + 'T09:00:00Z',
  })
})

// ---- games -------------------------------------------------------------------
const G = [
  ['crash',    'Crash',            'instant',  'RollOriginals', 99.0, 'crash',    1, 0.1, 5000],
  ['slots',    'Mega Fortune',     'slots',    'NeonGaming',    96.2, 'slots',    1, 0.2, 1000],
  ['roulette', 'Roulette Royale',  'table',    'LiveDealer',    97.3, 'roulette', 1, 1,   10000],
  ['blackjack','Blackjack Pro',    'table',    'LiveDealer',    99.5, 'blackjack',1, 1,   5000],
  ['plinko',   'Plinko Drop',      'instant',  'RollOriginals',99.0, 'plinko',   1, 0.1, 2000],
  ['mines',    'Mines',            'instant',  'RollOriginals',99.0, 'mines',    1, 0.1, 2000],
  ['wheel',    'Wheel of Fortune', 'instant',  'RollOriginals',96.5, 'wheel',    0, 0.1, 1000],
  ['dice',     'Dice Duel',        'instant',  'RollOriginals',99.0, 'dice',     1, 0.1, 5000],
  ['baccarat', 'Baccarat',         'table',    'LiveDealer',    98.9, 'baccarat', 0, 1,   10000],
  ['poker',    'Video Poker',      'poker',    'NeonGaming',    98.0, 'poker',    0, 0.2, 500],
  ['keno',     'Keno',             'lottery',  'NeonGaming',    95.0, 'keno',     0, 0.1, 500],
  ['hilo',     'Hi-Lo',            'cards',    'RollOriginals',99.0, 'hilo',     0, 0.1, 1000],
  ['sicbo',    'Sic Bo',           'table',    'LiveDealer',    97.2, 'sicbo',    0, 1,   5000],
  ['scratch',  'Scratch Gold',     'instant',  'NeonGaming',    94.0, 'scratch',  0, 0.5, 200],
  ['bingo',    'Bingo Blast',      'lottery',  'NeonGaming',    93.5, 'bingo',    0, 0.2, 100],
  ['tiger',    'Fortune Tiger',    'slots',    'NeonGaming',    96.8, 'tiger',    1, 0.2, 800],
]
const insG = db.prepare('INSERT INTO games(slug,name,category,provider,rtp,tile,popular,min_bet,max_bet) VALUES (?,?,?,?,?,?,?,?,?)')
G.forEach(g => insG.run(g))

// ---- promos ------------------------------------------------------------------
const PR = [
  ['WELCOME100', 'match',    100, 20, 1, 1, '100% match on your first deposit up to 500 RC'],
  ['FREESPINS',  'credit',   25,  0,  1, 1, '25 RC free play — new players'],
  ['VIPBOOST',   'credit',   50,  50, 1, 1, '50 RC boost for VIP members'],
  ['CASHBACK10', 'cashback', 10,  0,  0, 1, '10% weekly cashback'],
  ['LUCKY7',     'credit',   7,   0,  1, 1, '7 RC on us — feeling lucky?'],
]
const insPR = db.prepare('INSERT INTO promos(code,kind,value,min_deposit,single_use,active,description) VALUES (?,?,?,?,?,?,?)')
PR.forEach(p => insPR.run(p))

// demo has an active welcome bonus with an unmet wager requirement (V8 target)
db.prepare(`INSERT INTO bonuses(player_id,promo_code,amount,wager_required,wager_done,status,created)
  VALUES (1,'WELCOME100',25,500,0,'active','2024-05-02T09:05:00Z')`).run()

// ---- ledger (realistic history) ---------------------------------------------
const insL = db.prepare('INSERT INTO ledger(player_id,kind,amount,balance_after,ref,created) VALUES (?,?,?,?,?,?)')
const seedLedger = [
  [1, 'deposit', 50, 50, 'dep_1001', '2024-05-02T09:01:00Z'],
  [1, 'bonus', 25, 75, 'WELCOME100', '2024-05-02T09:05:00Z'],
  [1, 'bet', -5, 70, 'crash', '2024-05-02T09:10:00Z'],
  [1, 'win', 2.5, 72.5, 'crash', '2024-05-02T09:10:05Z'],
  [1, 'bet', -25, 47.5, 'slots', '2024-05-02T09:20:00Z'],
  [2, 'deposit', 5000, 5000, 'dep_2001', '2024-04-10T12:00:00Z'],
  [2, 'win', 9000, 14000, 'blackjack', '2024-04-11T20:00:00Z'],
  [2, 'withdraw', -1500, 12500, 'wd_2002', '2024-04-12T08:00:00Z'],
  [4, 'deposit', 100000, 100000, 'dep_4001', '2024-03-22T10:00:00Z'],
  [4, 'withdraw', -2000, 98000, 'wd_4002', '2024-03-25T10:00:00Z'],
  [13, 'deposit', 30000, 30000, 'dep_1301', '2024-01-30T10:00:00Z'],
  [13, 'win', 500, 30500, 'dice', '2024-02-01T10:00:00Z'],
]
seedLedger.forEach(l => insL.run(l))

// ---- bets (history feature + base rows for the search endpoint, V10) --------
const insB = db.prepare('INSERT INTO bets(player_id,game_slug,stake,multiplier,payout,status,nonce,created) VALUES (?,?,?,?,?,?,?,?)')
;[
  [1, 'crash', 5, 2, 10, 'won', 1, '2024-05-02T09:10:00Z'],
  [1, 'slots', 25, 0, 0, 'lost', 2, '2024-05-02T09:20:00Z'],
  [1, 'dice', 2, 0, 0, 'lost', 3, '2024-05-02T09:25:00Z'],
  [2, 'blackjack', 500, 3, 1500, 'won', 1, '2024-04-11T20:00:00Z'],
  [4, 'roulette', 1000, 0, 0, 'lost', 1, '2024-03-24T18:00:00Z'],
].forEach(b => insB.run(b))

// ---- kyc docs (BOLA target, V2). Enumerable integer ids. Fake image bytes. ---
const insK = db.prepare('INSERT INTO kyc_docs(doc_uuid,player_id,type,filename,content,status,created) VALUES (?,?,?,?,?,?,?)')
const fakeImg = (label) => 'data:image/png;base64,' + Buffer.from('FAKE-KYC-IMAGE:' + label).toString('base64')
const seedKyc = [
  [2, 'id_front', 'alex_morgan_passport.png', fakeImg('highroller/passport'), 'approved'],
  [2, 'selfie', 'alex_morgan_selfie.png', fakeImg('highroller/selfie'), 'approved'],
  [4, 'id_front', 'robert_bigsby_dl.png', fakeImg('whale/drivers-license'), 'approved'],
  [4, 'selfie', 'robert_bigsby_selfie.png', fakeImg('whale/selfie'), 'approved'],
  [6, 'id_front', 'grace_chen_id.png', fakeImg('goldenace/id'), 'approved'],
  [13, 'id_front', 'satoshi_passport.png', fakeImg('cryptoking/passport'), 'approved'],
  [13, 'selfie', 'satoshi_selfie.png', fakeImg('cryptoking/selfie'), 'approved'],
]
seedKyc.forEach((k, i) => insK.run(`kyc_${String(i + 1).padStart(4, '0')}`, k[0], k[1], k[2], k[3], k[4], '2024-04-01T00:00:00Z'))

// ---- inbox messages (BOLA target, V3) ---------------------------------------
const insM = db.prepare('INSERT INTO messages(player_id,folder,subject,body,is_system,reset_token,read,created) VALUES (?,?,?,?,?,?,?,?)')
const seedMsg = [
  [1, 'Welcome to RollHouse 🎰', 'Thanks for joining! Your 25 RC welcome bonus is ready in the cashier.', 1, 1, '2024-05-02T09:00:00Z'],
  [1, 'Deposit received', 'We received your deposit of 50 RC. Good luck!', 1, 1, '2024-05-02T09:01:00Z'],
  [2, 'Withdrawal processed', 'Your withdrawal of 1500 RC has been sent to your account.', 1, 1, '2024-04-12T08:00:00Z'],
  [4, 'VIP status upgraded', 'Congratulations Robert — you are now Diamond VIP.', 1, 0, '2024-03-26T10:00:00Z'],
  [17, 'Staff onboarding', 'Welcome to the RollHouse promotions team. Reach ops@rollhouse.bet for access issues.', 1, 1, '2024-01-05T09:00:00Z'],
]
seedMsg.forEach(m => insM.run(m[0], 'inbox', m[1], m[2], m[3], null, m[4], m[5]))

// ---- social: chat + feed (benign seed; stored-XSS lands here at runtime, V11)-
const insC = db.prepare('INSERT INTO chat(player_id,username,message,created) VALUES (?,?,?,?)')
;[[3, 'lucky7', 'gl everyone 🍀'], [5, 'mrspin', 'slots are hot today'], [11, 'diceduke', 'dice never lies'], [10, 'neonNina', 'up 400 on crash lets go']]
  .forEach((c, i) => insC.run(c[0], c[1], c[2], '2024-05-01T1' + i + ':00:00Z'))
const insF = db.prepare('INSERT INTO feed(player_id,username,game,amount,note,created) VALUES (?,?,?,?,?,?)')
;[[4, 'whale', 'blackjack', 9000, 'ran it up on BJ'], [13, 'cryptoking', 'crash', 5000, 'cashed at 12x'], [15, 'highstakes', 'roulette', 3200, 'straight up on 7']]
  .forEach((f, i) => insF.run(f[0], f[1], f[2], f[3], f[4], '2024-05-0' + (i + 1) + 'T20:00:00Z'))

// ---- tickets, staff notes, audit --------------------------------------------
db.prepare("INSERT INTO tickets(player_id,subject,body,status,created) VALUES (1,'How do I withdraw?','I have a welcome bonus, when can I cash out?','open','2024-05-03T10:00:00Z')").run()
const insSN = db.prepare('INSERT INTO staff_notes(player_id,author,note,created) VALUES (?,?,?,?)')
;[
  [4, 'mia.chen', 'Whale VIP — expedite all withdrawals, skip manual review.', '2024-04-01T10:00:00Z'],
  [1, 'mia.chen', 'New player, welcome bonus active. Standard wager rules.', '2024-05-02T10:00:00Z'],
  // SQLi-leakable operational hint (V10 -> points at the formula/secret surface)
  [0, 'root', 'Ops reminder: bonus formulas are evaluated live in the staff promo console. Rotate config/app.secret after launch.', '2024-01-02T09:00:00Z'],
].forEach(n => insSN.run(n))
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('root','config.update','promo_email_template updated','2024-01-03T09:00:00Z')").run()

// ---- config (admin-editable; promo_email_template is the V14 sink) ----------
const insCfg = db.prepare('INSERT INTO config(key,value) VALUES (?,?)')
;[
  ['site_name', 'RollHouse'],
  ['maintenance', 'false'],
  ['welcome_bonus', '25'],
  ['support_email', 'support@rollhouse.bet'],
  ['min_withdrawal', '20'],
  ['promo_email_template', 'Hi {{ name }}, your {{ bonus }} RC bonus is ready. Play now at RollHouse!'],
].forEach(c => insCfg.run(c))

module.exports = { db }
