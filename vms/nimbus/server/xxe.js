// Deliberately vulnerable XML importer (V5 — XXE). It honours DOCTYPE SYSTEM
// entities and expands them by reading the referenced local file, exactly like a
// misconfigured XML parser with external entities enabled. Fully in-container
// (no network entities — file read only).
const fs = require('fs')

function importXml(xml) {
  const entities = {}
  // External SYSTEM entities: <!ENTITY xxe SYSTEM "file:///etc/passwd">
  let m, re = /<!ENTITY\s+(\w+)\s+SYSTEM\s+["']([^"']+)["']\s*>/g
  while ((m = re.exec(xml))) {
    const p = m[2].replace(/^file:\/\//, '')
    try { entities[m[1]] = fs.readFileSync(p, 'utf8') } catch (e) { entities[m[1]] = '[unreadable: ' + e.message + ']' }
  }
  // Internal entities: <!ENTITY foo "bar">
  re = /<!ENTITY\s+(\w+)\s+["']([^"']*)["']\s*>/g
  while ((m = re.exec(xml))) { if (!(m[1] in entities)) entities[m[1]] = m[2] }
  // Drop the DOCTYPE, then expand &name; references in the body.
  let body = xml.replace(/<!DOCTYPE[\s\S]*?\]>/, '').replace(/<!DOCTYPE[^>]*>/, '')
  body = body.replace(/&(\w+);/g, (_, n) => (n in entities ? entities[n] : '&' + n + ';'))
  return body.trim()
}
module.exports = { importXml }
