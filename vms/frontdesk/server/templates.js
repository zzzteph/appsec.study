const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
// renders an admin-supplied announcement template server-side (planted SSTI)
function render(tpl, ctx) { return env.renderString(String(tpl), ctx || {}) }
module.exports = { render }
