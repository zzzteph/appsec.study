<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post, currentUser } from '../../api'
import { avatar } from '../../assets/art'

const me = currentUser()
const isAdmin = computed(() => me && me.role === 'admin')
const tab = ref('dashboard'); const denied = ref(false)
const dash = ref(null); const customers = ref([]); const review = ref(null); const cfg = ref(null)
const tpl = ref('Statement for {{ name }} — closing balance {{ balance }} USD.'); const out = ref(null); const terr = ref('')
const tplHint = 'Variables: name, balance'

async function loadDash() { try { dash.value = await get('/staff/dashboard') } catch { denied.value = true } }
onMounted(loadDash)
async function go(t) {
  tab.value = t
  try {
    if (t === 'customers') customers.value = await get('/staff/customers')
    if (t === 'review') review.value = await get('/staff/review')
    if (t === 'config') cfg.value = await get('/admin/config')
  } catch {}
}
async function preview() { terr.value = ''; out.value = null; try { out.value = await post('/staff/report/preview', { template: tpl.value }) } catch (e) { terr.value = e.message } }
const TABS = [['dashboard', 'Dashboard'], ['customers', 'Customers'], ['review', 'Review'], ['report', 'Report Builder']]
</script>

<template>
  <div v-if="denied" class="card warnbox">Staff access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Back Office</h1><span class="badge staff">{{ me.role }}</span></div>
    <div class="tabs" style="max-width:600px">
      <button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button>
      <button v-if="isAdmin" :class="{ active: tab === 'config' }" @click="go('config')">Config</button>
    </div>

    <div v-if="tab === 'dashboard' && dash" class="grid g4">
      <div class="card stat"><div class="n">{{ dash.customers }}</div><div class="l">Customers</div></div>
      <div class="card stat"><div class="n">{{ dash.accounts }}</div><div class="l">Accounts</div></div>
      <div class="card stat"><div class="n green">${{ Math.round(dash.deposits).toLocaleString() }}</div><div class="l">Deposits</div></div>
      <div class="card stat"><div class="n">{{ dash.open_tickets }}</div><div class="l">Open tickets</div></div>
    </div>

    <div v-if="tab === 'customers'" class="card">
      <table><thead><tr><th>ID</th><th>Customer</th><th>Email</th><th>Role</th><th>KYC</th><th>Limit</th></tr></thead>
        <tbody><tr v-for="c in customers" :key="c.id"><td>{{ c.id }}</td>
          <td><div class="row"><img class="avatar" :src="avatar(c.username, 26)" width="26" height="26" />{{ c.name }}</div></td>
          <td class="muted">{{ c.email }}</td><td><span class="badge" :class="c.role==='customer'?'ok':'staff'">{{ c.role }}</span></td>
          <td><span class="badge" :class="c.kyc_status==='verified'?'ok':'warn'">{{ c.kyc_status }}</span></td><td>${{ c.daily_limit }}</td></tr></tbody></table>
    </div>

    <div v-if="tab === 'review' && review" class="grid g2" style="align-items:start">
      <div class="card"><h3>Transfer memos</h3>
        <div v-for="t in review.transfers" :key="t.id" class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="muted">#{{ t.id }}</span> <span v-html="t.memo"></span><span class="grow"></span><b>${{ t.amount }}</b></div>
      </div>
      <div class="card"><h3>Support tickets</h3>
        <div v-for="t in review.tickets" :key="t.id" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>{{ t.subject }}</b><div class="muted" style="font-size:13px" v-html="t.body"></div></div>
      </div>
    </div>

    <div v-if="tab === 'report'" class="card">
      <h3>Statement / report template</h3>
      <p class="muted" style="font-size:13px">{{ tplHint }}. Preview renders the template.</p>
      <textarea v-model="tpl" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
      <div v-if="terr" class="err-inline" style="margin-top:10px">{{ terr }}</div>
    </div>

    <div v-if="tab === 'config' && cfg" class="card">
      <table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table>
    </div>
  </template>
</template>
