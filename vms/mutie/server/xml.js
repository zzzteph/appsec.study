const libxmljs = require('libxmljs2')
// external-entity substitution ON → XXE file reads (used by the partner-invoice block when its vuln is live)
function parseXXE(xml) { return libxmljs.parseXml(xml, { noent: true, dtdload: true, nonet: true }) }
module.exports = { parseXXE }
