// shared vuln helpers, reused across blocks (same logic proven in the latty machines)
const pug = require('pug')

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const isPrivate = (u) => /^(https?:\/\/)?(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|localhost|\[?::1)/i.test(String(u || ''))

// {{ }} evaluator — SSTI→RCE (process reachable)
function evalRender(tpl, data) {
  return String(tpl == null ? '' : tpl).replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => {
    try { return String(Function('c', 'with (c) { return (' + e + ') }')(data || {})) } catch (err) { return '{{err}}' }
  })
}

// {{{ }}} triple-brace evaluator — mimics a Handlebars "raw" bypass (variant: handlebars). The syntax
// is intentionally different from evalRender so the same {{ … }} payload does NOT trigger this variant.
function tripleBraceRender(tpl, data) {
  return String(tpl == null ? '' : tpl).replace(/\{\{\{([\s\S]+?)\}\}\}/g, (_, e) => {
    try { return String(Function('c', 'with (c) { return (' + e + ') }')(data || {})) } catch (err) { return '{{{err}}}' }
  })
}

// Pug SSTI — pug.render allows `- code` blocks (unbuffered code) and `#{expr}` interpolation, both of
// which execute arbitrary JS. Real library, real vulnerability class.
function pugSSTIRender(tpl, data) {
  return pug.render(String(tpl == null ? '' : tpl), Object.assign({}, data || {}))
}

module.exports = { esc, isPrivate, evalRender, tripleBraceRender, pugSSTIRender }
