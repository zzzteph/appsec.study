const nunjucks = require('nunjucks')
const env = new nunjucks.Environment(null, { autoescape: true })
function render(t, ctx) { return env.renderString(String(t), ctx || {}) }
module.exports = { render }
