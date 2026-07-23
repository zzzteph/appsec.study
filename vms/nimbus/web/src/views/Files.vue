<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
const router = useRouter()
const files = ref([]); const shared = ref([]); const q = ref(''); const results = ref(null)
const up = ref({ name: '', content: '' }); const toast = ref(null)
async function load() { const d = await get('/files'); files.value = d.files; shared.value = d.shared }
onMounted(load)
async function search() { results.value = await get('/files-search?q=' + encodeURIComponent(q.value)) }
async function upload() { if (!up.value.name) return; await post('/files', up.value); up.value = { name: '', content: '' }; toast.value = 'Uploaded'; setTimeout(() => toast.value = null, 1800); await load() }
const icon = (f) => f.is_folder ? '📁' : (f.mime || '').includes('image') ? '🖼' : (f.mime || '').includes('pdf') ? '📕' : '📄'
</script>
<template>
  <div class="row" style="margin-bottom:16px"><h1 style="margin:0">My Files</h1><span class="grow"></span>
    <input v-model="q" placeholder="search files…" style="width:200px" @keyup.enter="search" /><button class="btn sm" @click="search">Search</button></div>

  <div v-if="results" class="card" style="margin-bottom:16px">
    <h3>Search results</h3>
    <div v-for="r in results" :key="r.id" class="filerow" @click="router.push('/file/' + r.id)"><div class="fico">📄</div><div><b>{{ r.name }}</b><div class="muted" style="font-size:12px">{{ r.mime }} · {{ r.size }} KB</div></div></div>
  </div>

  <div class="grid" style="grid-template-columns:1.6fr 1fr;align-items:start">
    <div class="card">
      <h3>Files</h3>
      <div v-for="f in files" :key="f.id" class="filerow" @click="!f.is_folder && router.push('/file/' + f.id)"><div class="fico">{{ icon(f) }}</div>
        <div class="grow"><b>{{ f.name }}</b><div class="muted" style="font-size:12px">{{ f.is_folder ? 'Folder' : f.mime + ' · ' + f.size + ' KB' }}</div></div></div>
      <h3 style="margin-top:16px" v-if="shared.length">Shared with me</h3>
      <div v-for="f in shared" :key="'s'+f.id" class="filerow" @click="router.push('/file/' + f.id)"><div class="fico">🔗</div>
        <div class="grow"><b>{{ f.name }}</b><div class="muted" style="font-size:12px">{{ f.permission }} access</div></div></div>
    </div>
    <div class="card">
      <h3>Upload</h3>
      <div class="field"><label>File name</label><input v-model="up.name" placeholder="report.txt" /></div>
      <div class="field"><label>Content</label><textarea v-model="up.content"></textarea></div>
      <button class="btn primary" style="width:100%" @click="upload">Upload</button>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
