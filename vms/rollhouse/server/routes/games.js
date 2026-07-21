// Games, promos, VIP, store. Planted: V6 (crash settle trusts client multiplier),
// V10 (bet-history search SQLi + V20 verbose error), V12 (predictable fair seeds),
// V7 (promo redeem: no single-use / stacking / ownership checks).
const express = require('express')
const router = express.Router()
const { db, requireAuth, player, adjust } = require('./_util')
const fair = require('../fair')

// ---- catalogue (secure, public) ---------------------------------------------
router.get('/games', (req, res) => {
  const cat = req.query.category
  const rows = cat
    ? db.prepare('SELECT * FROM games WHERE category = ? ORDER BY popular DESC, name').all(cat)
    : db.prepare('SELECT * FROM games ORDER BY popular DESC, name').all()
  res.json(rows)
})
// NOTE: /games/:slug (single-segment GET) is defined AFTER the specific
// /games/history and /games/fair/* routes so it doesn't shadow them.

// ---- secure bet (server-authoritative outcome) — the hardened path ----------
router.post('/games/:slug/bet', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const g = db.prepare('SELECT * FROM games WHERE slug = ?').get(req.params.slug)
  if (!g) return res.status(404).json({ error: 'no such game' })
  const stake = Number((req.body || {}).stake)
  if (!isFinite(stake) || stake < g.min_bet || stake > g.max_bet)
    return res.status(400).json({ error: `bet must be between ${g.min_bet} and ${g.max_bet} RC` })
  const p = player(u.id)
  if (stake > p.balance) return res.status(400).json({ error: 'insufficient balance' })
  const ss = fair.serverSeed(u.id, p.nonce)
  const r = fair.roll(ss, p.client_seed, p.nonce)
  const win = r < (g.rtp / 200)           // house-edged ~coin-flip
  const mult = win ? 2 : 0
  const payout = Math.round(stake * mult * 100) / 100
  adjust(u.id, 'bet', -stake, g.slug)
  const bal = payout > 0 ? adjust(u.id, 'win', payout, g.slug) : player(u.id).balance
  db.prepare('UPDATE players SET nonce = nonce + 1, wager_progress = wager_progress + ? WHERE id = ?').run(stake, u.id)
  db.prepare(`INSERT INTO bets(player_id,game_slug,stake,multiplier,payout,status,nonce,created)
    VALUES (?,?,?,?,?,?,?, datetime('now'))`).run(u.id, g.slug, stake, mult, payout, win ? 'won' : 'lost', p.nonce)
  res.json({ outcome: { roll: r, win, multiplier: mult }, stake, payout, balance: bal, nonce: p.nonce })
})

// V6 — Crash "instant cashout" settles at a client-supplied multiplier with no
// server-side validation against the real crash point -> arbitrary winnings.
router.post('/games/crash/settle', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const stake = Number((req.body || {}).stake || 0)
  const mult = Number((req.body || {}).cashoutMultiplier)
  if (!isFinite(mult) || mult <= 0) return res.status(400).json({ error: 'invalid multiplier' })
  const p = player(u.id)
  if (stake > p.balance) return res.status(400).json({ error: 'insufficient balance' })
  const payout = Math.round(stake * mult * 100) / 100
  adjust(u.id, 'bet', -stake, 'crash')
  const bal = adjust(u.id, 'win', payout, 'crash')
  db.prepare(`INSERT INTO bets(player_id,game_slug,stake,multiplier,payout,status,nonce,created)
    VALUES (?,?,?,?,?, 'won', ?, datetime('now'))`).run(u.id, 'crash', stake, mult, payout, p.nonce)
  res.json({ ok: true, stake, multiplier: mult, payout, balance: bal })
})

// V10 — bet-history search. `q` is concatenated straight into SQL -> UNION SQLi
// (dump players incl. mia.chen's md5, staff_notes, etc). Verbose error (V20)
// leaks the failing SQL to help craft the injection.
router.get('/games/history', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT game_slug, stake, multiplier, payout, status, created
               FROM bets WHERE player_id = ${u.id} AND game_slug LIKE '%${q}%' ORDER BY id DESC`
  try {
    res.json(db.prepare(sql).all())
  } catch (e) {
    res.status(400).json({ error: 'history query failed', detail: e.message, sql })
  }
})

// ---- provably fair -----------------------------------------------------------
// V12 — the "commitment" is derived from public inputs + a salt that also ships
// client-side, so the next server seed (hence outcome) is predictable.
router.get('/games/fair/seeds', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  const nextSeed = fair.serverSeed(u.id, p.nonce)
  const past = []
  for (let n = Math.max(1, p.nonce - 5); n < p.nonce; n++) {
    const ss = fair.serverSeed(u.id, n)
    past.push({ nonce: n, server_seed: ss, roll: fair.roll(ss, p.client_seed, n) })
  }
  res.json({
    client_seed: p.client_seed, nonce: p.nonce, salt: fair.FAIR_SALT,
    next_server_seed_hash: fair.serverSeedHash(nextSeed), past,
  })
})
router.post('/games/fair/verify', (req, res) => {
  const { server_seed, client_seed, nonce } = req.body || {}
  if (!server_seed || !client_seed || nonce == null) return res.status(400).json({ error: 'server_seed, client_seed, nonce required' })
  res.json({ roll: fair.roll(server_seed, client_seed, Number(nonce)), crash_point: fair.crashPoint(fair.roll(server_seed, client_seed, Number(nonce))) })
})
router.post('/games/fair/rotate', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const seed = String((req.body || {}).client_seed || '').slice(0, 64) || (u.username + '-seed')
  db.prepare('UPDATE players SET client_seed = ?, nonce = 1 WHERE id = ?').run(seed, u.id)
  res.json({ ok: true, client_seed: seed })
})

// Single-segment game lookup — declared last so /games/history and /games/fair/*
// (declared above) are matched first.
router.get('/games/:slug', (req, res) => {
  const g = db.prepare('SELECT * FROM games WHERE slug = ?').get(req.params.slug)
  if (!g) return res.status(404).json({ error: 'no such game' })
  res.json(g)
})

// ---- promos & bonuses --------------------------------------------------------
router.get('/promos', (req, res) => res.json(db.prepare('SELECT code,kind,value,min_deposit,description FROM promos WHERE active = 1').all()))
// V7 — no per-user single-use, no stacking cap, no ownership: redeem freely.
router.post('/promo/redeem', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const code = String((req.body || {}).code || '').toUpperCase()
  const promo = db.prepare('SELECT * FROM promos WHERE code = ? AND active = 1').get(code)
  if (!promo) return res.status(404).json({ error: 'invalid or expired promo code' })
  const credited = promo.value
  db.prepare('UPDATE players SET bonus_balance = bonus_balance + ? WHERE id = ?').run(credited, u.id)
  db.prepare("INSERT INTO promo_redemptions(promo_id,player_id,created) VALUES (?,?, datetime('now'))").run(promo.id, u.id)
  res.json({ ok: true, code, credited, bonus_balance: player(u.id).bonus_balance })
})
router.get('/bonuses', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT promo_code,amount,wager_required,wager_done,status FROM bonuses WHERE player_id = ?').all(u.id))
})
router.get('/bonuses/wagering', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  res.json({ wager_required: p.wager_required, wager_progress: p.wager_progress, wager_met: !!p.wager_met })
})

// ---- VIP / wheel / store / tournaments / missions (secured decoys) ----------
router.get('/vip', (req, res) => res.json([
  { tier: 'bronze', cashback: '2%', perks: ['Weekly bonus'] },
  { tier: 'silver', cashback: '5%', perks: ['Weekly bonus', 'Faster withdrawals'] },
  { tier: 'gold', cashback: '8%', perks: ['Daily bonus', 'Personal host'] },
  { tier: 'diamond', cashback: '12%', perks: ['Daily bonus', 'Personal host', 'Custom limits'] },
]))
router.post('/wheel/spin', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  const r = fair.roll(fair.serverSeed(u.id, p.nonce + 999), 'wheel', p.nonce)
  const prize = [0, 1, 2, 5, 10][Math.floor(r * 5)]
  if (prize) adjust(u.id, 'bonus', prize, 'daily_wheel')
  res.json({ ok: true, prize })
})
router.get('/store', (req, res) => res.json([
  { package: 'p1', coins: 100, price: 1 }, { package: 'p2', coins: 550, price: 5 },
  { package: 'p3', coins: 1200, price: 10 }, { package: 'p4', coins: 6500, price: 50 },
]))
router.post('/store/buy', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const pkgs = { p1: { coins: 100, price: 1 }, p2: { coins: 550, price: 5 }, p3: { coins: 1200, price: 10 }, p4: { coins: 6500, price: 50 } }
  const pkg = pkgs[(req.body || {}).package]
  if (!pkg) return res.status(400).json({ error: 'unknown package' })
  const bal = adjust(u.id, 'deposit', pkg.coins, 'store_' + (req.body || {}).package) // server-priced; client price ignored
  res.json({ ok: true, coins: pkg.coins, charged: pkg.price, balance: bal })
})
router.get('/tournaments', (req, res) => res.json([
  { id: 1, name: 'Weekend Slots Race', prize_pool: 10000, ends: '2024-06-02', joined: 842 },
  { id: 2, name: 'Crash Masters', prize_pool: 5000, ends: '2024-06-05', joined: 519 },
]))
router.get('/missions', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json([
    { id: 'daily_login', title: 'Log in today', reward: 1, done: true },
    { id: 'play_5', title: 'Play 5 rounds', reward: 3, done: false },
    { id: 'try_crash', title: 'Try Crash', reward: 2, done: false },
  ])
})

module.exports = router
