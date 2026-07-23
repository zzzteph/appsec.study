<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, currentUser } from '../api'
const router = useRouter()
const me = ref(currentUser()); const lines = ref([]); const bills = ref([])
onMounted(async () => { me.value = await get('/me'); lines.value = await get('/lines'); bills.value = await get('/bills') })
const due = () => bills.value.find(b => b.status === 'due')
</script>
<template>
  <h1>Overview</h1>
  <div class="hero" style="margin-bottom:18px">
    <div class="num">{{ me?.msisdn }}</div>
    <div class="big">{{ me?.plan }}</div>
    <div style="opacity:.9">{{ me?.data_allowance_gb >= 999 ? 'Unlimited data' : me?.data_allowance_gb + ' GB data' }} · {{ me?.tier }} tier</div>
    <div class="row" style="margin-top:14px"><button class="btn" style="background:#fff;color:#9b3cff" @click="router.push('/line')">Manage line</button>
      <button class="btn ghost" style="border-color:rgba(255,255,255,.4)" @click="router.push('/plans')">Change plan</button></div>
  </div>
  <div class="grid g3">
    <div class="card stat"><div class="l">Active lines</div><div class="n">{{ lines.length }}</div></div>
    <div class="card stat"><div class="l">Amount due</div><div class="n" :class="due() ? 'red' : 'ok'">${{ due() ? due().amount.toFixed(2) : '0.00' }}</div></div>
    <div class="card stat"><div class="l">Data allowance</div><div class="n">{{ me?.data_allowance_gb >= 999 ? '∞' : me?.data_allowance_gb + 'GB' }}</div></div>
  </div>
</template>
