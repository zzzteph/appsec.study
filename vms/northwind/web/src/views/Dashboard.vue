<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../api'

const router = useRouter()
const accounts = ref([]); const txns = ref([]); const q = ref(''); const results = ref(null)
onMounted(async () => {
  accounts.value = await get('/accounts')
  if (accounts.value[0]) txns.value = await get('/accounts/' + accounts.value[0].id + '/transactions')
})
async function search() { results.value = await get('/transactions/search?q=' + encodeURIComponent(q.value)) }
const total = () => accounts.value.reduce((s, a) => s + a.balance, 0)
</script>

<template>
  <div class="row" style="margin-bottom:18px"><h1 style="margin:0">Overview</h1><span class="grow"></span>
    <div class="card tight"><span class="muted" style="font-size:12px">Total balance</span><div style="font-size:22px;font-weight:800">${{ total().toLocaleString(undefined,{minimumFractionDigits:2}) }}</div></div></div>

  <div class="grid g3" style="margin-bottom:20px">
    <div v-for="a in accounts" :key="a.id" class="acct" :class="a.type">
      <div class="chip"></div>
      <div class="muted" style="text-transform:capitalize">{{ a.type }}</div>
      <div class="bal">${{ a.balance.toLocaleString(undefined,{minimumFractionDigits:2}) }}</div>
      <div class="num">{{ a.number }}</div>
      <button class="btn sm primary" style="margin-top:14px" @click="router.push('/transfer')">Transfer</button>
    </div>
  </div>

  <div class="grid g2" style="align-items:start">
    <div class="card">
      <h3>Recent activity</h3>
      <table><thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody><tr v-for="(t,i) in txns" :key="i"><td class="muted">{{ t.created }}</td><td>{{ t.memo }}<div class="muted" style="font-size:12px">{{ t.counterparty }}</div></td>
          <td :class="t.amount>=0?'green':'red'">{{ t.amount>=0?'+':'' }}${{ Math.abs(t.amount).toFixed(2) }}</td></tr></tbody></table>
    </div>
    <div class="card">
      <h3>Search transactions</h3>
      <div class="row"><input v-model="q" placeholder="search by description…" style="flex:1" @keyup.enter="search" /><button class="btn" @click="search">Search</button></div>
      <table v-if="results" style="margin-top:10px"><thead><tr><th>Description</th><th>Kind</th><th>Amount</th></tr></thead>
        <tbody><tr v-for="(r,i) in results" :key="i"><td>{{ r.memo }}</td><td class="muted">{{ r.kind }}</td><td>{{ r.amount }}</td></tr></tbody></table>
    </div>
  </div>
</template>
