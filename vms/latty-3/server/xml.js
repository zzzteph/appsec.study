const libxmljs = require('libxmljs2')

// VULN[xxe]: parses with external-entity substitution ON (noent + dtdload), so a document that
// declares <!ENTITY x SYSTEM "file:///…"> has the file contents inlined. nonet keeps it to local
// files (no network), but that's still enough to read server-side config.
function parse(xml) {
  return libxmljs.parseXml(xml, { noent: true, dtdload: true, nonet: true })
}
module.exports = { parse }
