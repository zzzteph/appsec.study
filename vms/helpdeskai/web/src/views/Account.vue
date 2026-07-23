<template>
  <div class="section wrap">
    <h2>Account</h2>
    <div class="card" style="margin-bottom:18px" v-if="me">
      <div class="row"><div class="av ai" style="width:44px;height:44px">{{ (me.name||'?').slice(0,1) }}</div>
        <div><div style="font-weight:700;font-size:16px">{{ me.name }}</div><div class="muted">{{ me.email }}</div></div>
        <span class="spacer"></span><span class="pill" :class="{pro: me.plan==='Pro'}">{{ me.plan }} plan</span>
      </div>
      <div class="muted" style="margin-top:12px">Billing address: {{ me.address }}</div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">Your orders</h3>
      <table v-if="orders.length">
        <thead><tr><th>#</th><th>Item</th><th>Amount</th><th>Status</th><th>Card</th></tr></thead>
        <tbody><tr v-for="o in orders" :key="o.id"><td>{{ o.id }}</td><td>{{ o.item }}</td><td>{{ money(o.amount) }}</td><td><span class="pill">{{ o.status }}</span></td><td class="muted">•••• {{ o.card_last4 }}</td></tr></tbody>
      </table>
      <div v-else class="muted">No orders yet.</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
import { money } from '../assets/art.js'
const me = ref(null); const orders = ref([])
onMounted(async () => { me.value = await get('/account'); orders.value = await get('/orders') })
</script>
