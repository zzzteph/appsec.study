// Back-office "statement / report template" builder renders a template with
// Nunjucks renderString over staff-controlled input -> SSTI RCE (V12):
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
function render(template, ctx) { return env.renderString(String(template), ctx || {}) }
module.exports = { render }
