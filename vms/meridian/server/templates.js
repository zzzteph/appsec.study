// Admin "login-page branding" + welcome-email templates are rendered server-side
// with Nunjucks renderString over admin-controlled input -> SSTI RCE (V11):
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })

function render(template, ctx) {
  return env.renderString(String(template), ctx || {})
}
module.exports = { render }
