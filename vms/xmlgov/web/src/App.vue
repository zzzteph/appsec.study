<script setup>
import { ref } from 'vue'
import { logo } from './art'
const ENV = (inner) => `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
${inner}
  </soap:Body>
</soap:Envelope>`
const TEMPLATES = {
  Authenticate: ENV('    <Authenticate>\n      <username>operator</username>\n      <password>operator</password>\n    </Authenticate>'),
  LookupRecord: ENV('    <LookupRecord>\n      <id>R-1001</id>\n    </LookupRecord>'),
  ListRecords: ENV('    <ListRecords/>'),
  ImportDocument: ENV('    <ImportDocument>\n      <content><![CDATA[<?xml version="1.0"?><note>hello</note>]]></content>\n    </ImportDocument>'),
}
const OPS = [['Authenticate', 0], ['LookupRecord', 0], ['ListRecords', 0], ['ImportDocument', 0], ['AdminExport', 1], ['RunDiagnostics', 1]]
const op = ref('Authenticate')
const body = ref(TEMPLATES.Authenticate)
const resp = ref(''); const busy = ref(false)
function pick(o) { op.value = o; body.value = TEMPLATES[o] || ENV(`    <${o}/>`) }
async function send() {
  busy.value = true; resp.value = ''
  try { const r = await fetch('/service', { method: 'POST', headers: { 'Content-Type': 'text/xml', SOAPAction: op.value }, body: body.value }); resp.value = await r.text() }
  catch (e) { resp.value = 'ERROR: ' + e.message } finally { busy.value = false }
}
async function wsdl() { busy.value = true; try { resp.value = await (await fetch('/service?wsdl')).text() } finally { busy.value = false } }
</script>
<template>
  <div class="topbar">
    <div class="brand"><img :src="logo(30)" /> XmlGov · Records Exchange</div>
    <span class="tag">SOAP 1.1</span><span class="tag">v1.2 (legacy)</span>
    <span class="grow"></span>
    <button class="btn ghost" @click="wsdl">View WSDL</button>
  </div>
  <div class="content">
    <p class="muted">Legacy SOAP records-exchange service. Choose an operation, edit the envelope, and send it to <span class="mono">/service</span>.</p>
    <div class="ops">
      <button v-for="o in OPS" :key="o[0]" :class="{ active: op === o[0], internal: o[1] }" @click="pick(o[0])">{{ o[0] }}<span v-if="o[1]"> ⚠</span></button>
    </div>
    <div class="grid">
      <div class="card">
        <div class="row" style="margin-bottom:8px"><h3 style="margin:0">Request</h3><span class="grow"></span><button class="btn" :disabled="busy" @click="send">Send</button></div>
        <textarea v-model="body" spellcheck="false"></textarea>
      </div>
      <div class="card">
        <h3>Response</h3>
        <div class="resp">{{ resp || '// response appears here' }}</div>
      </div>
    </div>
  </div>
</template>
