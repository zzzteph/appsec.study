<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../../api'
import { avatar } from '../../assets/art'
const tab = ref('overview'); const denied = ref(false)
const ov = ref(null); const employees = ref([]); const expenses = ref([]); const cfg = ref(null)
const tpl = ref('Dear {{ name }}, your {{ title }} salary is {{ salary }} USD effective this period.'); const out = ref(null); const terr = ref('')
async function loadOv() { try { ov.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOv)
async function go(t) { tab.value = t; try { if (t === 'employees') employees.value = await get('/admin/employees'); if (t === 'expenses') expenses.value = await get('/admin/expenses'); if (t === 'config') cfg.value = await get('/admin/config') } catch {} }
async function preview() { terr.value = ''; out.value = null; try { out.value = await post('/admin/letter/preview', { template: tpl.value }) } catch (e) { terr.value = e.message } }
const TABS = [['overview', 'Overview'], ['employees', 'Employees'], ['expenses', 'Expenses'], ['letters', 'Letter Builder'], ['config', 'Config']]
</script>
<template>
  <div v-if="denied" class="card" style="border-color:var(--warn)">HR administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">HR Console</h1><span class="badge brand">admin</span></div>
    <div class="tabs" style="max-width:620px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button></div>
    <div v-if="tab === 'overview' && ov" class="grid g3">
      <div class="card stat"><div class="n">{{ ov.employees }}</div><div class="l">Employees</div></div>
      <div class="card stat"><div class="n">{{ ov.expenses_pending }}</div><div class="l">Pending expenses</div></div>
      <div class="card stat"><div class="n">{{ ov.payslips }}</div><div class="l">Payslips</div></div>
    </div>
    <div v-if="tab === 'employees'" class="card"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Dept</th><th>Role</th><th>Salary</th></tr></thead>
      <tbody><tr v-for="e in employees" :key="e.id"><td>{{ e.id }}</td><td><div class="row"><img class="avatar" :src="avatar(e.name, 26)" width="26" height="26" />{{ e.name }}</div></td><td class="muted">{{ e.email }}</td><td>{{ e.department }}</td><td><span class="badge" :class="e.role==='employee'?'ok':'brand'">{{ e.role }}</span></td><td>${{ e.salary }}</td></tr></tbody></table></div>
    <div v-if="tab === 'expenses'" class="card"><h3>Expense review</h3>
      <div v-for="e in expenses" :key="e.id" class="comment"><b>#{{ e.employee_id }}</b> ${{ e.amount }} · {{ e.category }} <span class="badge" :class="e.status==='approved'?'ok':'warn'">{{ e.status }}</span><div class="muted" style="font-size:13px" v-html="e.memo"></div></div>
    </div>
    <div v-if="tab === 'letters'" class="card">
      <h3>HR letter template</h3>
      <p class="muted" style="font-size:13px">Variables: name, title, salary. Preview renders it.</p>
      <textarea v-model="tpl" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
      <div v-if="terr" class="err-inline" style="margin-top:10px">{{ terr }}</div>
    </div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
