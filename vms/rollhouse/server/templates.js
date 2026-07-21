// The two server-side evaluation sinks (staff/admin gated).
//
// V13 — Bonus Formula (staff). Promotions team can define a bonus payout as a
// small math expression evaluated per player, e.g. "deposit * 0.1 + streak".
// It is evaluated with Function() over a context object -> SSTI/eval RCE:
//   this.constructor.constructor('return process')().mainModule.require('child_process').execSync('id')
//
// V14 — Promo email template (admin). The marketing email template is rendered
// with Nunjucks renderString over attacker-influenced input -> template-injection
// RCE via the standard {{range.constructor(...)}} gadget.
const nunjucks = require('nunjucks')
const njk = new nunjucks.Environment(null, { autoescape: true })

function evalFormula(formula, ctx) {
  // ctx: { deposit, streak, tier, losses, player }
  const fn = new Function('deposit', 'streak', 'tier', 'losses', 'player', 'Math',
    `return (${formula});`)
  return fn(ctx.deposit, ctx.streak, ctx.tier, ctx.losses, ctx.player, Math)
}

function renderEmail(template, ctx) {
  return njk.renderString(String(template), ctx || {})
}

module.exports = { evalFormula, renderEmail }
