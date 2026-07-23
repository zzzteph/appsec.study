// The Range — answer key. Each challenge yields its FLAG only when the planted
// vulnerability is actually exploited. The scoring endpoint validates submitted
// flags against this map; the map itself is never exposed via the API.
const FLAGS = {
  1:  { class: 'sqli',            difficulty: 'easy',   flag: 'FLAG{range-sqli-a1b2c3d4}',        endpoint: 'GET  /api/c/1?q=',        hint: 'Search is built with string concatenation — UNION in the secret table.' },
  2:  { class: 'sqli-blind',      difficulty: 'hard',   flag: 'FLAG{range-blindsqli-e5f6a7b8}',   endpoint: 'GET  /api/c/2?token=',    hint: 'Only true/false comes back. Extract the flag char by char.' },
  3:  { class: 'idor',            difficulty: 'easy',   flag: 'FLAG{range-idor-11223344}',        endpoint: 'GET  /api/c/3?doc=',      hint: 'Document ids are enumerable and unauthorized.' },
  4:  { class: 'lfi',             difficulty: 'easy',   flag: 'FLAG{range-lfi-55667788}',         endpoint: 'GET  /api/c/4?file=',     hint: 'Path traversal — read c4.flag.' },
  5:  { class: 'ssti',            difficulty: 'medium', flag: 'FLAG{range-ssti-99aabbcc}',        endpoint: 'POST /api/c/5 {tpl}',     hint: 'The template is rendered server-side (Nunjucks).' },
  6:  { class: 'cmd-injection',   difficulty: 'medium', flag: 'FLAG{range-cmdi-ddeeff00}',        endpoint: 'POST /api/c/6 {host}',    hint: 'Diagnostics shells out — inject a command that reads c6.flag.' },
  7:  { class: 'xxe',             difficulty: 'medium', flag: 'FLAG{range-xxe-13579bdf}',         endpoint: 'POST /api/c/7 (xml)',     hint: 'External entities are enabled — read c7.flag.' },
  8:  { class: 'auth-bypass-jwt', difficulty: 'medium', flag: 'FLAG{range-jwtnone-2468ace0}',     endpoint: 'GET  /api/c/8',           hint: 'The token verifier accepts alg:none.' },
  9:  { class: 'open-redirect',   difficulty: 'easy',   flag: 'FLAG{range-openredir-1a2b3c4d}',   endpoint: 'GET  /api/c/9?url=',      hint: 'redirect target is unvalidated.' },
  10: { class: 'xss-reflected',   difficulty: 'easy',   flag: 'FLAG{range-xss-5e6f7a8b}',         endpoint: 'GET  /api/c/10?q=',       hint: 'Input is reflected into HTML unescaped.' },
  11: { class: 'mass-assignment', difficulty: 'easy',   flag: 'FLAG{range-massassign-9c0d1e2f}',  endpoint: 'PATCH /api/c/11 {role}',  hint: 'The profile update honours a role field.' },
  12: { class: 'nosql-injection', difficulty: 'medium', flag: 'FLAG{range-nosqli-3a4b5c6d}',      endpoint: 'POST /api/c/12 {password}', hint: 'Send an operator object instead of a string.' },
  13: { class: 'auth-bypass-hdr', difficulty: 'medium', flag: 'FLAG{range-hdrbypass-7e8f9a0b}',   endpoint: 'GET  /api/c/13',          hint: '"Local" requests are trusted via a forwarded header.' },
  14: { class: 'info-disclosure', difficulty: 'easy',   flag: 'FLAG{range-infodisc-c1d2e3f4}',    endpoint: 'GET  /api/c/14/debug',    hint: 'A debug endpoint leaks internal config.' },
}
module.exports = { FLAGS }
