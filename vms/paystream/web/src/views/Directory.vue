<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
import { avatar } from '../assets/art'
const list = ref([]); const q = ref(''); const open = ref(null); const reports = ref([])
async function load() { list.value = await get('/employees') }
onMounted(load)
async function search() { list.value = await get('/employees/search?q=' + encodeURIComponent(q.value)) }
async function view(e) { open.value = await get('/employees/' + e.id); try { reports.value = await get('/employees/' + e.id + '/reports') } catch { reports.value = [] } }
</script>
<template>
  <h1>Employee Directory</h1>
  <div class="row" style="margin-bottom:14px"><input v-model="q" placeholder="search by name or title…" style="flex:1" @keyup.enter="search" /><button class="btn" @click="search">Search</button></div>
  <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start">
    <div class="card">
      <div v-for="e in list" :key="e.id" class="row" style="padding:9px 0;border-bottom:1px solid var(--line);cursor:pointer" @click="view(e)">
        <img class="avatar" :src="avatar(e.name, 30)" width="30" height="30" /><div><b>{{ e.name }}</b><div class="muted" style="font-size:12px">{{ e.title }} · {{ e.department }}</div></div>
      </div>
    </div>
    <div class="card" v-if="open">
      <div class="row" style="margin-bottom:8px"><img class="avatar" :src="avatar(open.name, 44)" width="44" height="44" /><div><h3 style="margin:0">{{ open.name }}</h3><span class="muted">{{ open.title }} · {{ open.department }}</span></div></div>
      <table><tbody>
        <tr><td class="muted">Email</td><td>{{ open.email }}</td></tr>
        <tr><td class="muted">Salary</td><td>${{ open.salary }}</td></tr>
        <tr><td class="muted">SSN</td><td class="mono">{{ open.ssn }}</td></tr>
        <tr><td class="muted">Bank</td><td class="mono">{{ open.bank_account }}</td></tr>
        <tr><td class="muted">Address</td><td>{{ open.address }}</td></tr>
      </tbody></table>
      <div v-if="reports.length" style="margin-top:12px"><h4>Direct reports</h4>
        <div v-for="r in reports" :key="r.id" class="muted" style="font-size:13px">{{ r.name }} — {{ r.title }} (${{ r.salary }})</div></div>
    </div>
    <div class="card center muted" v-else style="min-height:120px">Select an employee.</div>
  </div>
</template>
