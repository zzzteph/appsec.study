<script setup>
import { ref, onMounted } from 'vue'
import { get, post, token } from '../api'
const where = ref("region = 'North'"); const rows = ref([]); const err = ref('')
const queries = ref([]); const newQ = ref({ name: '', description: '' }); const toast = ref(null)
async function run() { err.value = ''; try { const d = await post('/query/run', { where: where.value }); rows.value = d.rows } catch (e) { err.value = e.message; rows.value = [] } }
async function loadQ() { queries.value = await get('/queries') }
onMounted(() => { run(); loadQ() })
async function saveQ() { if (!newQ.value.name) return; await post('/queries', newQ.value); newQ.value = { name: '', description: '' }; await loadQ(); toast.value = 'Query saved'; setTimeout(() => toast.value = null, 1800) }
function exportCsv() { window.open('/api/export/csv?t=' + token(), '_blank') }
</script>
<template>
  <h1>Explore</h1>
  <div class="card" style="margin-bottom:16px">
    <h3>Query builder — Sales 2024</h3>
    <div class="field"><label>Filter (WHERE expression)</label><input v-model="where" class="mono" @keyup.enter="run" /></div>
    <button class="btn primary" @click="run">Run query</button>
    <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
    <table v-if="rows.length" style="margin-top:14px"><thead><tr><th>ID</th><th>Region</th><th>Product</th><th>Amount</th><th>Rep</th></tr></thead>
      <tbody><tr v-for="(r,i) in rows.slice(0,50)" :key="i"><td>{{ r.id }}</td><td>{{ r.region }}</td><td>{{ r.product }}</td><td>{{ r.amount }}</td><td>{{ r.rep }}</td></tr></tbody></table>
  </div>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <div class="row"><h3 style="margin:0">Saved queries</h3><span class="grow"></span><button class="btn sm" @click="exportCsv">Export CSV</button></div>
      <div v-for="q in queries" :key="q.id" class="qrow"><b>{{ q.name }}</b><div class="muted" style="font-size:13px">{{ q.description }}</div></div>
    </div>
    <div class="card">
      <h3>Save a query</h3>
      <div class="field"><label>Name</label><input v-model="newQ.name" /></div>
      <div class="field"><label>Description</label><input v-model="newQ.description" /></div>
      <button class="btn primary" @click="saveQ">Save</button>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
