<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '../api'
const route = useRoute(); const wf = ref(null); const err = ref('')
onMounted(async () => { try { wf.value = await get('/workflows/' + route.params.id) } catch (e) { err.value = e.message } })
</script>
<template>
  <div class="content">
    <div v-if="err" class="card err-inline">{{ err }}</div>
    <div v-else-if="wf" class="card">
      <div class="row"><h1 style="margin:0">{{ wf.name }}</h1><span v-if="wf.private" class="badge brand">private</span></div>
      <div class="muted" style="font-size:13px;margin:4px 0 14px">owner: {{ wf.owner }}</div>
      <p>{{ wf.description }}</p>
      <h3 style="margin-top:14px">Config</h3>
      <div class="result">{{ wf.config }}</div>
    </div>
  </div>
</template>
