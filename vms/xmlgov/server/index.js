const express = require('express')
const cors = require('cors')
const path = require('path')
const { handle } = require('./soap')
const app = express()
app.disable('x-powered-by')
app.use(cors())
app.set('trust proxy', true)

// V4 — WSDL enumeration: lists every operation, including the privileged ones.
const WSDL = `<?xml version="1.0"?>
<definitions name="RecordsExchange" targetNamespace="urn:xmlgov:records"
  xmlns="http://schemas.xmlsoap.org/wsdl/" xmlns:tns="urn:xmlgov:records">
  <documentation>XmlGov Records Exchange Service v1.2 (legacy)</documentation>
  <portType name="RecordsPort">
    <operation name="Authenticate"><documentation>Authenticate a clerk</documentation></operation>
    <operation name="LookupRecord"><documentation>Look up a citizen record by id</documentation></operation>
    <operation name="ListRecords"><documentation>List records</documentation></operation>
    <operation name="ImportDocument"><documentation>Import an XML document</documentation></operation>
    <operation name="AdminExport"><documentation>[INTERNAL] Export all records incl. sealed</documentation></operation>
    <operation name="RunDiagnostics"><documentation>[INTERNAL] Run network diagnostics on the host</documentation></operation>
  </portType>
  <service name="RecordsExchange"><port name="RecordsPort"><soap:address location="/service"/></port></service>
</definitions>`

app.get('/service', (req, res) => { if (req.query.wsdl !== undefined) return res.type('text/xml').send(WSDL); res.type('text/xml').send('<info>POST a SOAP envelope here. GET ?wsdl for the service description.</info>') })
app.post('/service', express.text({ type: () => true, limit: '2mb' }), (req, res) => res.type('text/xml').send(handle(req.body || '')))
app.get('/api/version', (req, res) => res.json({ name: 'XmlGov Records Exchange', version: '1.2.0', node: process.version }))
app.get('/healthz', (req, res) => res.json({ ok: true }))

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.listen(80, () => console.log('XmlGov Records Exchange on :80'))
