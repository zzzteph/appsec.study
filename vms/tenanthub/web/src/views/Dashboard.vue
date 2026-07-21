<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../api'

const router = useRouter()
const projects = ref([]); const q = ref(''); const results = ref(null)
onMounted(async () => { projects.value = await get('/projects') })
async function search() { results.value = await get('/tickets/search?q=' + encodeURIComponent(q.value)) }
</script>

<template>
  <div class="row" style="margin-bottom:18px"><h1 style="margin:0">Projects</h1></div>
  <div class="grid g3" style="margin-bottom:22px">
    <div v-for="p in projects" :key="p.id" class="card" style="cursor:pointer" @click="router.push('/project/' + p.id)">
      <h3 style="margin:0 0 4px">{{ p.name }}</h3>
      <div class="muted" style="font-size:13px;min-height:36px">{{ p.description }}</div>
      <div class="badge role" style="margin-top:8px">org #{{ p.org_id }}</div>
    </div>
    <div v-if="!projects.length" class="muted">No projects in your workspaces yet.</div>
  </div>

  <div class="card">
    <h3>Search tickets</h3>
    <div class="row"><input v-model="q" placeholder="search tickets…" style="flex:1" @keyup.enter="search" /><button class="btn" @click="search">Search</button></div>
    <table v-if="results" style="margin-top:10px"><thead><tr><th>Title</th><th>Status</th><th>Priority</th></tr></thead>
      <tbody><tr v-for="(r,i) in results" :key="i" style="cursor:pointer" @click="r.id && router.push('/ticket/' + r.id)"><td>{{ r.title }}</td><td>{{ r.status }}</td><td>{{ r.priority }}</td></tr></tbody></table>
  </div>
</template>
