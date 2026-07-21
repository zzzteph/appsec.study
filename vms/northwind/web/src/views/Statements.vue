<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const list = ref([]); const open = ref(null)
onMounted(async () => { list.value = await get('/statements') })
async function view(s) { open.value = await get('/statements/' + s.id) }
</script>

<template>
  <h1>Statements</h1>
  <div class="grid" style="grid-template-columns:1fr 1.6fr;align-items:start">
    <div class="card">
      <div v-if="!list.length" class="muted">No statements available.</div>
      <div v-for="s in list" :key="s.id" class="row" style="padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer" @click="view(s)">
        <div><b>{{ s.period }}</b><div class="muted" style="font-size:12px">Account #{{ s.account_id }}</div></div>
        <span class="grow"></span><span class="badge ok">PDF</span>
      </div>
    </div>
    <div class="card" v-if="open"><h3>Statement {{ open.period }}</h3><div class="result">{{ open.content }}</div></div>
    <div class="card center muted" v-else style="min-height:120px">Select a statement to view.</div>
  </div>
</template>
