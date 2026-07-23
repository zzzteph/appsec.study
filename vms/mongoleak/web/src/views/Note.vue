<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get } from '../api'
const route = useRoute(); const note = ref(null); const err = ref('')
onMounted(async () => { try { note.value = await get('/notes/' + route.params.id) } catch (e) { err.value = e.message } })
</script>
<template>
  <div class="content">
    <div v-if="err" class="card err-inline">{{ err }}</div>
    <div v-else-if="note" class="card">
      <div class="row"><h1 style="margin:0">{{ note.title }}</h1><span v-if="note.private" class="badge brand">private</span></div>
      <div class="muted" style="font-size:13px;margin:4px 0 14px">owner: {{ note.owner }}</div>
      <p style="white-space:pre-wrap">{{ note.body }}</p>
    </div>
  </div>
</template>
