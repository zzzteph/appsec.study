// shared vuln helpers, reused across blocks (same logic proven in the latty machines)
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const isPrivate = (u) => /^(https?:\/\/)?(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|localhost|\[?::1)/i.test(String(u || ''))
// {{ }} evaluator — SSTI→RCE (process reachable)
function evalRender(tpl, data) {
  return String(tpl == null ? '' : tpl).replace(/\{\{([\s\S]+?)\}\}/g, (_, e) => {
    try { return String(Function('c', 'with (c) { return (' + e + ') }')(data || {})) } catch (err) { return '{{err}}' }
  })
}
module.exports = { esc, isPrivate, evalRender }
