<script setup>
// import kind — POST /import { xml } for invoice ingest.
import { ref } from 'vue'
import { apiPost, findEndpoint } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const xml = ref(`<?xml version="1.0"?>
<invoice><ref>INV-1001</ref><customer>Acme Co</customer><amount>420.00</amount></invoice>`)
const output = ref(null); const err = ref('')

async function submit() {
  const ep = findEndpoint(props.view, 'import'); if (!ep) return
  const r = await apiPost(ep.p, { xml: xml.value }); output.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
</script>
<template>
<div>
  <div v-if="layout === 0" class="grid" style="grid-template-columns:2fr 1fr;gap:1rem">
    <div class="card pad">
      <b>XML import</b>
      <textarea class="field" rows="12" v-model="xml" style="font-family:ui-monospace,Menlo,monospace"></textarea>
      <button class="btn accent" @click="submit">Import</button>
    </div>
    <div class="card pad">
      <b>Result</b>
      <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
      <p class="muted">Accepts standard invoice XML.</p>
    </div>
  </div>
  <div v-else class="card pad">
    <b>Bulk import</b>
    <p class="muted">Paste your XML and we'll parse it.</p>
    <textarea class="field" rows="10" v-model="xml"></textarea>
    <button class="btn" @click="submit">Submit</button>
    <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
</div>
</template>
