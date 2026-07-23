<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post, currentUser } from '../../api'
import { avatar } from '../../assets/art'
const me = currentUser()
const isAdmin = computed(() => me && me.role === 'admin')
const tab = ref('dashboard'); const denied = ref(false)
const dash = ref(null); const subs = ref([]); const review = ref(null); const cfg = ref(null)
const tpl = ref('Hi {{ name }}, your {{ plan }} bill is {{ amount }} USD.'); const out = ref(null); const terr = ref('')
async function loadDash() { try { dash.value = await get('/staff/dashboard') } catch { denied.value = true } }
onMounted(loadDash)
async function go(t) { tab.value = t; try { if (t === 'subscribers') subs.value = await get('/staff/subscribers'); if (t === 'review') review.value = await get('/staff/review'); if (t === 'config') cfg.value = await get('/admin/config') } catch {} }
async function preview() { terr.value = ''; out.value = null; try { out.value = await post('/staff/report/preview', { template: tpl.value }) } catch (e) { terr.value = e.message } }
const TABS = [['dashboard', 'Dashboard'], ['subscribers', 'Subscribers'], ['review', 'Review'], ['report', 'Templates']]
</script>
<template>
  <div v-if="denied" class="card warnbox">Agent access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Back Office</h1><span class="badge staff">{{ me.role }}</span></div>
    <div class="tabs" style="max-width:600px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button><button v-if="isAdmin" :class="{ active: tab === 'config' }" @click="go('config')">Config</button></div>
    <div v-if="tab === 'dashboard' && dash" class="grid g4">
      <div class="card stat"><div class="n">{{ dash.subscribers }}</div><div class="l">Subscribers</div></div>
      <div class="card stat"><div class="n">{{ dash.lines }}</div><div class="l">Lines</div></div>
      <div class="card stat"><div class="n">{{ dash.open_tickets }}</div><div class="l">Open tickets</div></div>
      <div class="card stat"><div class="n">{{ dash.overdue_bills }}</div><div class="l">Overdue bills</div></div>
    </div>
    <div v-if="tab === 'subscribers'" class="card">
      <table><thead><tr><th>ID</th><th>Name</th><th>MSISDN</th><th>Email</th><th>Role</th><th>Plan</th></tr></thead>
        <tbody><tr v-for="s in subs" :key="s.id"><td>{{ s.id }}</td><td><div class="row"><img class="avatar" :src="avatar(s.username, 26)" width="26" height="26" />{{ s.name }}</div></td>
          <td class="mono">{{ s.msisdn }}</td><td class="muted">{{ s.email }}</td><td><span class="badge" :class="s.role==='subscriber'?'ok':'staff'">{{ s.role }}</span></td><td>{{ s.plan }}</td></tr></tbody></table>
    </div>
    <div v-if="tab === 'review' && review" class="card">
      <h3>Support requests</h3>
      <div v-for="t in review.tickets" :key="t.id" style="padding:9px 0;border-bottom:1px solid var(--line)"><b>{{ t.subject }}</b> <span class="muted" style="font-size:12px">#{{ t.subscriber_id }}</span><div class="muted" style="font-size:13px" v-html="t.body"></div></div>
    </div>
    <div v-if="tab === 'report'" class="card">
      <h3>Bill / notification template</h3>
      <p class="muted" style="font-size:13px">Variables: name, plan, amount. Preview renders it.</p>
      <textarea v-model="tpl" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
      <div v-if="terr" class="err-inline" style="margin-top:10px">{{ terr }}</div>
    </div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
