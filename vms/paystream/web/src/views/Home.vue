<script setup>
import { ref, onMounted } from 'vue'
import { get, post, currentUser } from '../api'
const me = currentUser()
const payslips = ref([]); const expenses = ref([]); const ex = ref({ amount: 0, category: 'Travel', memo: '' }); const toast = ref(null)
async function load() { payslips.value = await get('/payslips'); expenses.value = await get('/expenses') }
onMounted(load)
async function submitEx() { if (!ex.value.amount) return; await post('/expenses', ex.value); ex.value = { amount: 0, category: 'Travel', memo: '' }; await load(); toast.value = 'Expense submitted'; setTimeout(() => toast.value = null, 1800) }
async function approve(e) { await post('/expenses/' + e.id + '/approve'); await load() }
</script>
<template>
  <h1>Home</h1>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <h3>Payslips</h3>
      <table><thead><tr><th>Period</th><th>Gross</th><th>Tax</th><th>Net</th></tr></thead>
        <tbody><tr v-for="p in payslips" :key="p.id"><td>{{ p.period }}</td><td>${{ p.gross }}</td><td class="red">-${{ p.tax }}</td><td><b>${{ p.net }}</b></td></tr></tbody></table>
    </div>
    <div class="card">
      <h3>Submit expense</h3>
      <div class="row"><input v-model="ex.amount" type="number" placeholder="amount" style="width:110px" /><input v-model="ex.category" placeholder="category" style="flex:1" /></div>
      <div class="field" style="margin-top:10px"><label>Memo</label><input v-model="ex.memo" /></div>
      <button class="btn primary" @click="submitEx">Submit</button>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <h3>My expenses</h3>
    <table><thead><tr><th>Amount</th><th>Category</th><th>Memo</th><th>Status</th><th></th></tr></thead>
      <tbody><tr v-for="e in expenses" :key="e.id"><td>${{ e.amount }}</td><td>{{ e.category }}</td><td>{{ e.memo }}</td>
        <td><span class="badge" :class="e.status==='approved'?'ok':'warn'">{{ e.status }}</span></td>
        <td><button v-if="e.status==='pending'" class="btn sm" @click="approve(e)">Approve</button></td></tr></tbody></table>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
