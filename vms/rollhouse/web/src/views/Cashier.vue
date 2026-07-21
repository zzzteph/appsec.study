<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'

const methods = ref([]); const wallet = ref(null)
const dep = ref({ method: 'visa', amount: 100 })
const wd = ref({ amount: 50, code: '' })
const toast = ref(null); const err = ref('')

async function load() { methods.value = await get('/cashier/methods'); wallet.value = await get('/wallet') }
onMounted(load)
function flash(m, ok = true) { toast.value = { m, ok }; setTimeout(() => toast.value = null, 2600) }

async function deposit() {
  err.value = ''
  try { const d = await post('/cashier/deposit', { method: dep.value.method, amount: Number(dep.value.amount) }); flash(`Deposited ${d.credited} RC`); await load() }
  catch (e) { err.value = e.message }
}
async function withdraw() {
  err.value = ''
  try { const d = await post('/cashier/withdraw', { amount: Number(wd.value.amount), code: wd.value.code }); flash(`Withdrawal of ${d.amount} RC ${d.status}`); await load() }
  catch (e) { err.value = e.message }
}
</script>

<template>
  <h1>Cashier</h1>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <h3>Deposit</h3>
      <div class="field"><label>Method</label>
        <select v-model="dep.method"><option v-for="m in methods" :key="m.id" :value="m.id">{{ m.label }}</option></select>
      </div>
      <div class="field"><label>Amount (RC)</label><input v-model="dep.amount" type="number" /></div>
      <button class="btn gold" style="width:100%" @click="deposit">Deposit now</button>
      <p class="muted" style="font-size:12px;margin-top:10px">Deposits are instant. Bonuses apply automatically.</p>
    </div>

    <div class="card">
      <h3>Withdraw</h3>
      <div class="field"><label>Amount (RC)</label><input v-model="wd.amount" type="number" /></div>
      <div class="field"><label>2FA code</label><input v-model="wd.code" placeholder="6-digit code" maxlength="6" /></div>
      <button class="btn primary" style="width:100%" @click="withdraw">Request withdrawal</button>
      <div v-if="wallet && !wallet.wager_met" class="warnbox" style="margin-top:12px">
        ⚠️ Wagering requirement not met — {{ wallet.wager_progress }} / {{ wallet.wager_required }} RC wagered.
      </div>
    </div>
  </div>

  <div v-if="err" class="err-inline" style="margin-top:14px">{{ err }}</div>

  <div class="card" style="margin-top:20px">
    <h3>Recent transactions</h3>
    <table v-if="wallet">
      <thead><tr><th>Type</th><th>Amount</th><th>Balance</th><th>Ref</th><th>Date</th></tr></thead>
      <tbody>
        <tr v-for="(t, i) in wallet.recent" :key="i">
          <td style="text-transform:capitalize">{{ t.kind }}</td>
          <td :class="t.amount >= 0 ? 'green' : 'red'">{{ t.amount >= 0 ? '+' : '' }}{{ t.amount }} RC</td>
          <td>{{ t.balance_after }} RC</td><td class="muted mono">{{ t.ref }}</td><td class="muted">{{ t.created }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="toast" class="toast" :class="toast.ok ? 'ok' : 'err'">{{ toast.m }}</div>
</template>
