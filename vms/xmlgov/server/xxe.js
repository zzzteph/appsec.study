// Deliberately vulnerable XML entity expander (V1 — XXE). Honours DOCTYPE SYSTEM
// entities by reading the referenced local file — like a parser with external
// entities enabled. File read only (no network).
const fs = require('fs')
function expand(xml) {
  const entities = {}
  let m, re = /<!ENTITY\s+(\w+)\s+SYSTEM\s+["']([^"']+)["']\s*>/g
  while ((m = re.exec(xml))) { const p = m[2].replace(/^file:\/\//, ''); try { entities[m[1]] = fs.readFileSync(p, 'utf8') } catch (e) { entities[m[1]] = '[unreadable: ' + e.message + ']' } }
  re = /<!ENTITY\s+(\w+)\s+["']([^"']*)["']\s*>/g
  while ((m = re.exec(xml))) { if (!(m[1] in entities)) entities[m[1]] = m[2] }
  let body = xml.replace(/<!DOCTYPE[\s\S]*?\]>/, '').replace(/<!DOCTYPE[^>]*>/, '')
  return body.replace(/&(\w+);/g, (_, n) => (n in entities ? entities[n] : '&' + n + ';')).trim()
}
module.exports = { expand }
