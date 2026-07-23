<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const dashboards = ref([]); const open = ref(null)
onMounted(async () => { dashboards.value = await get('/dashboards') })
async function view(d) { open.value = await get('/dashboards/' + d.id) }
</script>
<template>
  <h1>Dashboards</h1>
  <div class="grid g3" style="margin-bottom:18px">
    <div v-for="d in dashboards" :key="d.id" class="card" style="cursor:pointer" @click="view(d)">
      <div class="bar" style="margin-bottom:12px"></div>
      <h3 style="margin:0 0 4px">{{ d.name }}</h3>
      <div class="muted" style="font-size:13px">{{ d.description }}</div>
      <span class="badge" :class="d.is_public ? 'ok' : 'brand'" style="margin-top:8px">{{ d.is_public ? 'shared' : 'private' }}</span>
    </div>
  </div>
  <div v-if="open" class="card"><h3>{{ open.name }}</h3><p class="muted">{{ open.description }}</p>
    <div class="grid g4" style="margin-top:12px"><div v-for="i in 4" :key="i" class="card tight center" style="height:80px"><div class="bar" style="width:70%"></div></div></div>
  </div>
</template>
