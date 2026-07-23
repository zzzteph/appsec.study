<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const lines = ref([]); const usage = ref([]); const swap = ref({ new_sim: '', verified: false }); const toast = ref(null); const err = ref('')
async function load() { lines.value = await get('/lines'); if (lines.value[0]) usage.value = await get('/lines/' + lines.value[0].id + '/usage') }
onMounted(load)
async function doSwap() {
  err.value = ''
  try { const l = lines.value[0]; const d = await post('/lines/' + l.id + '/sim-swap', { new_sim: swap.value.new_sim, verified: swap.value.verified }); toast.value = 'SIM swapped: ' + d.new_sim; setTimeout(() => toast.value = null, 2400); await load() }
  catch (e) { err.value = e.message }
}
</script>
<template>
  <h1>My Line</h1>
  <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start">
    <div class="card" v-if="lines[0]">
      <h3>{{ lines[0].msisdn }}</h3>
      <table><tbody>
        <tr><td class="muted">Plan</td><td>{{ lines[0].plan }}</td></tr>
        <tr><td class="muted">SIM serial</td><td class="mono">{{ lines[0].sim_serial }}</td></tr>
        <tr><td class="muted">Status</td><td><span class="badge ok">{{ lines[0].status }}</span></td></tr>
      </tbody></table>
      <h3 style="margin-top:18px">Swap SIM / eSIM</h3>
      <div class="field"><label>New SIM serial</label><input v-model="swap.new_sim" placeholder="8901…" /></div>
      <label class="row" style="font-size:13px;gap:8px"><input type="checkbox" v-model="swap.verified" style="width:auto" /> I confirm my identity</label>
      <button class="btn primary" style="margin-top:10px;width:100%" @click="doSwap">Swap SIM</button>
      <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
    </div>
    <div class="card">
      <h3>Recent usage</h3>
      <table><thead><tr><th>Date</th><th>Type</th><th>To / Destination</th><th>Amount</th></tr></thead>
        <tbody><tr v-for="(u,i) in usage" :key="i"><td class="muted">{{ u.created }}</td><td>{{ u.type }}</td><td class="mono">{{ u.counterparty }}</td><td>{{ u.amount }} {{ u.unit }}</td></tr></tbody></table>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
