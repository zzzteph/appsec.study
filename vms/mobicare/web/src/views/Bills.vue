<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const bills = ref([]); const open = ref(null)
onMounted(async () => { bills.value = await get('/bills') })
async function view(b) { open.value = await get('/bills/' + b.id) }
</script>
<template>
  <h1>Bills</h1>
  <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start">
    <div class="card">
      <div v-if="!bills.length" class="muted">No bills.</div>
      <div v-for="b in bills" :key="b.id" class="row" style="padding:10px 0;border-bottom:1px solid var(--line);cursor:pointer" @click="view(b)">
        <div><b>{{ b.period }}</b><div class="muted" style="font-size:12px">Line #{{ b.line_id }}</div></div>
        <span class="grow"></span><b>${{ b.amount.toFixed(2) }}</b><span class="badge" :class="b.status === 'due' ? 'warn' : 'ok'">{{ b.status }}</span>
      </div>
    </div>
    <div class="card" v-if="open"><h3>Bill {{ open.period }} — ${{ open.amount.toFixed(2) }}</h3>
      <div class="muted" style="font-size:13px;margin-bottom:10px">Status: {{ open.status }} · File: <span class="mono">{{ open.filename }}</span></div>
      <a class="btn sm" :href="'/api/bills/download?file=' + open.filename" target="_blank">Download</a>
    </div>
    <div class="card center muted" v-else style="min-height:120px">Select a bill.</div>
  </div>
</template>
