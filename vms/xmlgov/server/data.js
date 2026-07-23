// XmlGov data. Users live in an XML document that the Authenticate operation
// queries with XPath (V2 injection target). Citizen records are the IDOR /
// AdminExport data.
const usersXml = `<?xml version="1.0"?>
<users>
  <user><username>operator</username><password>operator</password><role>clerk</role><name>Ops User</name></user>
  <user><username>j.smith</username><password>Sm1th!2024</password><role>clerk</role><name>John Smith</name></user>
  <user><username>svc-admin</username><password>Adm1n$SvcKey7</password><role>admin</role><name>Service Admin</name></user>
</users>`

const records = [
  { id: 'R-1001', name: 'Alice Johnson', ssn: '123-45-6789', dob: '1985-03-12', address: '14 Oak St', status: 'active' },
  { id: 'R-1002', name: 'Bob Williams', ssn: '221-33-9087', dob: '1979-11-02', address: '88 Maple Ave', status: 'active' },
  { id: 'R-1003', name: 'Carol Davis', ssn: '318-22-4410', dob: '1990-06-25', address: '5 Pine Rd', status: 'flagged' },
  { id: 'R-9001', name: 'CLASSIFIED — Witness Protection', ssn: '000-00-0001', dob: '1970-01-01', address: 'REDACTED', status: 'sealed' },
]
module.exports = { usersXml, records }
