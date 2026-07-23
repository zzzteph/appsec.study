<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
const router = useRouter()
const workflows = ref([]); const q = ref(''); const results = ref(null)
const imp = ref('{"name":"Imported workflow","steps":["trigger"]}'); const impOut = ref(''); const err = ref('')
async function load() { workflows.value = await get('/workflows') }
onMounted(load)
async function search() { results.value = await get('/workflows/search?q=' + encodeURIComponent(q.value)) }
async function doImport() { err.value = ''; impOut.value = ''; try { const d = await post('/workflows/import', { data: imp.value }); impOut.value = JSON.stringify(d.imported) } catch (e) { err.value = e.message } }
</script>
<template>
  <div class="content">
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Workflows</h1><span class="grow"></span>
      <input v-model="q" placeholder="search…" style="width:200px" @keyup.enter="search" /><button class="btn sm" @click="search">Search</button></div>
    <div v-if="results" class="card" style="margin-bottom:16px"><h3>Search results</h3>
      <div v-for="r in results" :key="r.id" class="wf" style="margin-bottom:8px" @click="router.push('/workflow/' + r.id)"><b>{{ r.name }}</b><div class="muted" style="font-size:13px">{{ r.description }}</div></div></div>
    <div class="grid g2" style="align-items:start">
      <div class="grid">
        <div v-for="w in workflows" :key="w.id" class="wf" @click="router.push('/workflow/' + w.id)"><span v-if="w.private" class="lock">🔒</span><h4>{{ w.name }}</h4><div class="muted" style="font-size:13px">{{ w.description }}</div></div>
      </div>
      <div class="card">
        <h3>Import workflow</h3>
        <p class="muted" style="font-size:13px">Paste a serialized workflow export to import it.</p>
        <textarea v-model="imp" class="mono"></textarea>
        <button class="btn primary" style="margin-top:8px" @click="doImport">Import</button>
        <div v-if="impOut" class="result" style="margin-top:8px">{{ impOut }}</div>
        <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
      </div>
    </div>
  </div>
</template>
