<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'

const accounts = ref([]); const payees = ref([])
const f = ref({ from_account: '', to_account: '', amount: 100, code: '', memo: '' })
const toast = ref(null); const err = ref('')
onMounted(async () => {
  accounts.value = await get('/accounts'); payees.value = await get('/payees')
  if (accounts.value[0]) f.value.from_account = accounts.value[0].id
  if (accounts.value[1]) f.value.to_account = accounts.value[1].id
})
async function submit() {
  err.value = ''
  try {
    const d = await post('/transfers', { from_account: Number(f.value.from_account), to_account: Number(f.value.to_account), amount: Number(f.value.amount), code: f.value.code, memo: f.value.memo })
    toast.value = `Transferred $${d.amount.toFixed(2)}`; setTimeout(() => toast.value = null, 2400)
    accounts.value = await get('/accounts')
  } catch (e) { err.value = e.message }
}
</script>

<template>
  <h1>Transfer money</h1>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <div class="field"><label>From account</label><select v-model="f.from_account"><option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.type }} {{ a.number }} — ${{ a.balance.toFixed(2) }}</option></select></div>
      <div class="field"><label>To account</label><select v-model="f.to_account"><option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.type }} {{ a.number }}</option></select></div>
      <div class="field"><label>Amount (USD)</label><input v-model="f.amount" type="number" step="0.01" /></div>
      <div class="field"><label>Memo</label><input v-model="f.memo" placeholder="optional note" /></div>
      <div class="field"><label>2FA code</label><input v-model="f.code" placeholder="6-digit code" maxlength="6" /></div>
      <button class="btn primary" style="width:100%" @click="submit">Send transfer</button>
      <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
    </div>
    <div class="card">
      <h3>Saved payees</h3>
      <div v-if="!payees.length" class="muted">No saved payees.</div>
      <div v-for="p in payees" :key="p.id" class="row" style="padding:9px 0;border-bottom:1px solid var(--line)">
        <div><b>{{ p.name }}</b><div class="muted mono" style="font-size:12px">{{ p.account_number }} · {{ p.bank }}</div></div>
      </div>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
