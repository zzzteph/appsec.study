<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../../api'

const route = useRoute()
const captured = ref(null); const log = ref([])

onMounted(async () => {
  const q = route.query
  if (Object.keys(q).length) {
    captured.value = q
    try { await post('/api/catch?' + new URLSearchParams(q).toString()) } catch {}
  }
  try { log.value = await get('/api/catch') } catch {}
})
</script>

<template>
  <div class="content" style="max-width:720px">
    <h2>Auth Callback Inspector</h2>
    <p class="muted">A small utility that records OAuth redirect parameters it receives. Point a <span class="mono">redirect_uri</span> here to inspect the callback.</p>
    <div v-if="captured" class="card" style="border-color:var(--red)">
      <h3 class="red">Captured callback</h3>
      <div class="result">{{ JSON.stringify(captured, null, 2) }}</div>
    </div>
    <div class="card" style="margin-top:16px">
      <h3>Recent captures</h3>
      <div v-if="!log.length" class="muted">Nothing captured yet.</div>
      <div v-for="e in log" :key="e.id" class="result" style="margin-bottom:8px">{{ e.created }} — {{ e.data }}</div>
    </div>
  </div>
</template>
