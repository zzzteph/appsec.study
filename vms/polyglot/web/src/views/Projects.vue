<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../api'
const router = useRouter()
const projects = ref([]); const q = ref(''); const results = ref(null)
onMounted(async () => { projects.value = await get('/projects') })
async function search() { results.value = await get('/strings/search?q=' + encodeURIComponent(q.value)) }
</script>
<template>
  <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Projects</h1><span class="grow"></span>
    <input v-model="q" placeholder="search strings…" style="width:200px" @keyup.enter="search" /><button class="btn sm" @click="search">Search</button></div>
  <div v-if="results" class="card" style="margin-bottom:16px"><h3>String search</h3>
    <div v-for="r in results" :key="r.id" class="strrow"><div class="strkey">{{ r.key }}</div>{{ r.source_text }}</div>
  </div>
  <div class="grid g3">
    <div v-for="p in projects" :key="p.id" class="card" style="cursor:pointer" @click="router.push('/project/' + p.id)">
      <div class="row"><h3 style="margin:0">{{ p.name }}</h3></div>
      <div class="muted" style="font-size:13px;min-height:34px">{{ p.description }}</div>
      <span class="badge" :class="p.visibility === 'public' ? 'ok' : 'brand'">{{ p.visibility }}</span> <span class="muted" style="font-size:12px">source: {{ p.source_lang }}</span>
    </div>
  </div>
</template>
