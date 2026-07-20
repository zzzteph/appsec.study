<script setup>
// Developer console — raw view of every live endpoint, a token widget, and a manual request runner.
import { ref, computed } from 'vue'
import { state, apiGet, apiPost, apiPatch, apiDelete } from '../lib/store'

const method = ref('GET'); const path = ref('/manifest'); const body = ref(''); const out = ref(null); const err = ref('')

const all = computed(() => {
  const rows = []
  for (const v of state.views) for (const e of (v.endpoints || [])) rows.push({ view: v, e })
  return rows
})

function pick(row) { method.value = row.e.m; path.value = row.e.p; body.value = '' }

async function send() {
  err.value = ''; out.value = null
  let b = undefined
  if (body.value.trim()) { try { b = JSON.parse(body.value) } catch (e) { err.value = 'bad JSON body'; return } }
  let r
  if (method.value === 'GET') r = await apiGet(path.value)
  else if (method.value === 'POST') r = await apiPost(path.value, b || {})
  else if (method.value === 'PATCH') r = await apiPatch(path.value, b || {})
  else if (method.value === 'DELETE') r = await apiDelete(path.value)
  out.value = { status: r.status, ok: r.ok, data: r.data }
}
</script>
<template>
<section>
  <div class="section-title">Developer console <span class="chip">{{ all.length }} endpoints</span></div>
  <div class="card pad">
    <b>Request runner</b>
    <div class="row">
      <select class="field" v-model="method" style="width:110px">
        <option>GET</option><option>POST</option><option>PATCH</option><option>DELETE</option>
      </select>
      <input class="field" v-model="path" placeholder="/path" style="flex:1" />
      <button class="btn accent" @click="send">Send</button>
    </div>
    <label class="lbl">Body (JSON)</label>
    <textarea class="field" rows="3" v-model="body"></textarea>
    <pre class="err" v-if="err">{{ err }}</pre>
    <pre class="out" v-if="out">{{ JSON.stringify(out, null, 2) }}</pre>
  </div>

  <div class="card" style="margin-top:1rem">
    <div class="pad"><b>All live endpoints (this generation)</b> <span class="muted">Click to load into the runner.</span></div>
    <table class="data">
      <thead><tr><th>Method</th><th>Path</th><th>Kind</th><th>Block</th></tr></thead>
      <tbody>
        <tr v-for="(row, i) in all" :key="i" @click="pick(row)" style="cursor:pointer">
          <td><span class="chip cat">{{ row.e.m }}</span></td>
          <td class="mono">/api{{ row.e.p }}</td>
          <td>{{ row.e.kind }}</td>
          <td>{{ row.view.title }} <span class="muted">({{ row.view.id }})</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
</template>
