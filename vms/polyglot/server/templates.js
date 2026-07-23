// Translated messages support placeholders and are rendered server-side for
// "preview". Rendering a translation VALUE with Nunjucks means a malicious
// translation string is a template-injection -> SSTI RCE (V1):
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
function render(template, ctx) { return env.renderString(String(template), ctx || {}) }
module.exports = { render }
