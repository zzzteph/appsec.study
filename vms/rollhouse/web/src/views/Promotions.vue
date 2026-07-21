<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'

const promos = ref([]); const bonuses = ref([]); const wagering = ref(null)
const code = ref(''); const toast = ref(null); const err = ref('')
async function load() {
  promos.value = await get('/promos'); bonuses.value = await get('/bonuses'); wagering.value = await get('/bonuses/wagering')
}
onMounted(load)
async function redeem(c) {
  err.value = ''
  try { const d = await post('/promo/redeem', { code: c || code.value }); toast.value = `+${d.credited} RC bonus (${d.code})`; setTimeout(() => toast.value = null, 2600); await load() }
  catch (e) { err.value = e.message }
}
</script>

<template>
  <h1>Promotions</h1>
  <div class="card" style="margin-bottom:18px">
    <h3>Redeem a promo code</h3>
    <div class="row"><input v-model="code" placeholder="e.g. WELCOME100" style="flex:1" />
      <button class="btn primary" @click="redeem()">Redeem</button></div>
    <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
  </div>

  <div class="grid g3">
    <div v-for="p in promos" :key="p.code" class="card">
      <div class="row"><b class="gold">{{ p.code }}</b><span class="grow"></span><span class="badge warn">{{ p.kind }}</span></div>
      <p class="muted" style="font-size:13px;min-height:38px">{{ p.description }}</p>
      <button class="btn sm gold" @click="redeem(p.code)">Claim {{ p.value }}{{ p.kind === 'match' ? '%' : ' RC' }}</button>
    </div>
  </div>

  <div class="card" style="margin-top:20px" v-if="wagering">
    <h3>Your wagering</h3>
    <div class="row"><span class="muted">Progress</span><b>{{ wagering.wager_progress }} / {{ wagering.wager_required }} RC</b>
      <span class="grow"></span><span class="badge" :class="wagering.wager_met ? 'ok' : 'warn'">{{ wagering.wager_met ? 'Met' : 'In progress' }}</span></div>
    <div v-if="bonuses.length" style="margin-top:12px">
      <table><thead><tr><th>Bonus</th><th>Amount</th><th>Wagered</th><th>Status</th></tr></thead>
        <tbody><tr v-for="(b, i) in bonuses" :key="i"><td>{{ b.promo_code }}</td><td>{{ b.amount }} RC</td>
          <td>{{ b.wager_done }} / {{ b.wager_required }}</td><td><span class="badge ok">{{ b.status }}</span></td></tr></tbody></table>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
