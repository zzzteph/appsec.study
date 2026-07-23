<template>
  <div class="section wrap">
    <h2>Knowledge base</h2>
    <div class="row" style="margin-bottom:16px"><input v-model="q" placeholder="Search articles…" @input="run" style="max-width:420px" /></div>
    <div class="grid">
      <div v-for="a in shown" :key="a.id" class="card kbrow">
        <div class="row"><strong>{{ a.title }}</strong><span class="spacer"></span><span class="pill" v-for="t in (a.tags||'').split(',').slice(0,3)" :key="t" style="margin-left:6px">{{ t }}</span></div>
        <p class="muted" v-if="a.body" style="margin:8px 0 0">{{ a.body }}</p>
      </div>
      <div v-if="!shown.length" class="muted">No articles matched.</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const all = ref([]); const shown = ref([]); const q = ref('')
async function run(){ if (!q.value.trim()) { shown.value = all.value; return } shown.value = await get('/kb/search?q=' + encodeURIComponent(q.value)) }
onMounted(async () => { all.value = await get('/kb'); shown.value = all.value })
</script>
