// XmlGov SOAP service dispatcher. Planted: V1 (ImportDocument XXE), V2
// (Authenticate XPath injection), V3 (SOAP-action spoofing / broken function-level
// authz — privileged ops callable by anyone), V5 (RunDiagnostics command
// injection -> RCE), V6 (LookupRecord IDOR), V9 (verbose SOAP faults).
const { DOMParser } = require('@xmldom/xmldom')
const xpath = require('xpath')
const { execSync } = require('child_process')
const { usersXml, records } = require('./data')
const { expand } = require('./xxe')

const usersDoc = new DOMParser({ onError: () => {} }).parseFromString(usersXml, 'text/xml')
const OPS = ['Authenticate', 'LookupRecord', 'ListRecords', 'ImportDocument', 'AdminExport', 'RunDiagnostics']

function elems(doc, name) {
  const out = []; const all = doc.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) { const t = all[i].tagName || all[i].nodeName || ''; if (t === name || t.split(':').pop() === name) out.push(all[i]) }
  return out
}
const firstText = (doc, name) => { const e = elems(doc, name); return e.length ? String(e[0].textContent || '').trim() : '' }
const cdata = (s) => `<![CDATA[${String(s)}]]>`
const env = (inner) => `<?xml version="1.0"?>\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${inner}</soap:Body></soap:Envelope>`
const fault = (msg, detail) => env(`<soap:Fault><faultstring>${cdata(msg)}</faultstring><detail>${cdata(detail || '')}</detail></soap:Fault>`)

function handle(xml) {
  let doc
  try { doc = new DOMParser({ onError: () => {} }).parseFromString(String(xml || ''), 'text/xml') } catch (e) { return fault('malformed XML', e.stack) }
  const op = OPS.find(o => elems(doc, o).length) || ''

  try {
    if (op === 'Authenticate') {
      const u = firstText(doc, 'username'), p = firstText(doc, 'password')
      // V2 — XPath built by string concatenation: password `' or '1'='1` bypasses.
      const q = `//user[username/text()='${u}' and password/text()='${p}']`
      const nodes = xpath.select(q, usersDoc)
      if (!nodes.length) return env('<AuthResponse><authenticated>false</authenticated></AuthResponse>')
      const role = (xpath.select('string(./role)', nodes[0]) || 'clerk')
      const name = (xpath.select('string(./name)', nodes[0]) || '')
      const token = Buffer.from(`${xpath.select('string(./username)', nodes[0])}:${role}`).toString('base64')
      return env(`<AuthResponse><authenticated>true</authenticated><role>${role}</role><name>${cdata(name)}</name><token>${token}</token></AuthResponse>`)
    }
    if (op === 'LookupRecord') {   // V6 — IDOR: any record by id, no auth.
      const id = firstText(doc, 'id'); const r = records.find(x => x.id === id)
      if (!r) return env('<LookupResponse><found>false</found></LookupResponse>')
      return env(`<LookupResponse><found>true</found><record><id>${r.id}</id><name>${cdata(r.name)}</name><ssn>${r.ssn}</ssn><dob>${r.dob}</dob><address>${cdata(r.address)}</address><status>${r.status}</status></record></LookupResponse>`)
    }
    if (op === 'ListRecords') {
      return env('<ListResponse>' + records.map(r => `<record><id>${r.id}</id><name>${cdata(r.name)}</name><status>${r.status}</status></record>`).join('') + '</ListResponse>')
    }
    if (op === 'ImportDocument') {  // V1 — XXE: the document content is expanded.
      const content = firstText(doc, 'content')
      return env(`<ImportResponse><parsed>${cdata(expand(content))}</parsed></ImportResponse>`)
    }
    if (op === 'AdminExport') {     // V3 — privileged op, NO role check.
      return env('<ExportResponse>' + records.map(r => `<record><id>${r.id}</id><name>${cdata(r.name)}</name><ssn>${r.ssn}</ssn><dob>${r.dob}</dob><address>${cdata(r.address)}</address><status>${r.status}</status></record>`).join('') + '</ExportResponse>')
    }
    if (op === 'RunDiagnostics') {  // V3 + V5 — privileged, and shells out (RCE).
      const host = firstText(doc, 'host') || '127.0.0.1'
      let out; try { out = execSync('ping -c 1 ' + host + ' 2>&1', { encoding: 'utf8', timeout: 10000 }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
      return env(`<DiagnosticsResponse><output>${cdata(out)}</output></DiagnosticsResponse>`)
    }
    return fault('unknown operation', 'supported: ' + OPS.join(', '))
  } catch (e) {
    return fault('operation error', e.stack)  // V9 — verbose fault leaks stack/paths
  }
}
module.exports = { handle }
