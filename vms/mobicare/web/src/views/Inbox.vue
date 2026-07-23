<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const msgs = ref([]); const open = ref(null)
onMounted(async () => { msgs.value = await get('/inbox') })
async function read(m) { open.value = await get('/inbox/' + m.id) }
</script>
<template>
  <h1>Inbox</h1>
  <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start">
    <div class="card">
      <div v-if="!msgs.length" class="muted">No messages.</div>
      <div v-for="m in msgs" :key="m.id" class="row" style="padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer" @click="read(m)"><div><b>{{ m.subject }}</b><div class="muted" style="font-size:12px">{{ m.created }}</div></div></div>
    </div>
    <div class="card" v-if="open"><h3>{{ open.subject }}</h3><div class="muted" style="font-size:12px;margin-bottom:12px">{{ open.created }}</div><p style="white-space:pre-wrap">{{ open.body }}</p></div>
    <div class="card center muted" v-else style="min-height:120px">Select a message.</div>
  </div>
</template>
