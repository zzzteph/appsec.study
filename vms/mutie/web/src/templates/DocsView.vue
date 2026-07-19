<script setup>
// disclosure kind — OpenAPI/docs viewer and backup archive. Real endpoints: GET /openapi.json, GET /backup.
import { ref, onMounted, computed } from 'vue'
import { apiGet, findEndpoint } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const spec = ref(null); const backup = ref(''); const err = ref('')

async function load() {
  const docs = findEndpoint(props.view, 'docs')
  if (docs) { const r = await apiGet(docs.p); spec.value = r.data }
  const b = findEndpoint(props.view, 'backup-file')
  if (b) { const r = await apiGet(b.p); backup.value = r.text }
}
const paths = computed(() => spec.value && spec.value.paths ? Object.entries(spec.value.paths) : [])
onMounted(load)
</script>
<template>
<div>
  <div v-if="layout === 0">
    <div class="card pad">
      <b>API reference</b>
      <div class="chip" v-if="spec">{{ (spec.info && spec.info.title) || 'API' }} v{{ (spec.info && spec.info.version) || '1' }}</div>
      <table class="data" v-if="paths.length" style="margin-top:1rem">
        <thead><tr><th>Path</th><th>Methods</th></tr></thead>
        <tbody>
          <tr v-for="([p, ops], i) in paths" :key="i"><td class="mono">{{ p }}</td><td><span class="chip cat" v-for="m in Object.keys(ops)" :key="m">{{ m }}</span></td></tr>
        </tbody>
      </table>
      <p v-else class="muted">No paths defined.</p>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="backup">
      <b>Config backup</b>
      <pre class="out">{{ backup }}</pre>
    </div>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>

  <div v-else-if="layout === 1">
    <div class="grid" style="grid-template-columns: 1fr 2fr; gap: 1rem">
      <div class="card pad">
        <b>Sections</b>
        <ul class="listy">
          <li>Introduction</li><li>Authentication</li><li>Endpoints</li><li>Changelog</li>
        </ul>
      </div>
      <div class="card pad">
        <h3>API</h3>
        <p class="muted">Base URL: <span class="mono">/api</span></p>
        <div v-for="([p, ops], i) in paths" :key="i" style="border-top:1px solid var(--line);padding:.4rem 0">
          <span class="mono">{{ p }}</span>
          <span class="chip cat" v-for="m in Object.keys(ops)" :key="m">{{ m }}</span>
        </div>
        <details v-if="spec">
          <summary>Raw JSON</summary>
          <pre class="out">{{ JSON.stringify(spec, null, 2) }}</pre>
        </details>
        <div v-if="backup" style="margin-top:1rem">
          <b>Backup archive</b>
          <pre class="out">{{ backup }}</pre>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="layout === 2">
    <div class="card pad">
      <b>Developers</b>
      <p class="muted">Everything you need to integrate.</p>
      <pre class="out" v-if="spec">{{ JSON.stringify(spec, null, 2) }}</pre>
      <pre class="out" v-if="backup">{{ backup }}</pre>
    </div>
  </div>

  <div v-else-if="layout === 3">
    <div class="metrics">
      <div class="card metric"><div class="n">{{ paths.length }}</div><div class="l">endpoints</div></div>
      <div class="card metric"><div class="n">{{ spec ? '1.0' : '—' }}</div><div class="l">version</div></div>
      <div class="card metric"><div class="n">✓</div><div class="l">public</div></div>
    </div>
    <div class="card pad" style="margin-top:1rem">
      <pre class="out" v-if="spec">{{ JSON.stringify(spec, null, 2) }}</pre>
      <pre class="out" v-if="backup">{{ backup }}</pre>
    </div>
  </div>

  <div v-else>
    <div class="card pad">
      <h3>Status</h3>
      <div class="chip">Public</div><div class="chip">JSON</div><div class="chip">OpenAPI 3.0</div>
      <div v-if="spec"><h4>Paths</h4>
        <div v-for="([p, ops], i) in paths" :key="i" class="row">
          <span class="mono">{{ p }}</span>
          <span class="muted">{{ Object.keys(ops).join(', ') }}</span>
        </div>
      </div>
      <div v-if="backup"><h4>Backup file</h4><pre class="out">{{ backup }}</pre></div>
    </div>
  </div>
</div>
</template>
