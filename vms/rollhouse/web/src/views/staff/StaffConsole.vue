<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post, currentUser } from '../../api'
import { avatar } from '../../assets/art'

const me = currentUser()
const isAdmin = computed(() => me && me.role === 'admin')
const tab = ref('dashboard')
const denied = ref(false)
const dash = ref(null); const players = ref([]); const mod = ref(null); const kyc = ref([])
const formula = ref('deposit * 0.1 + streak'); const formulaOut = ref(null); const formulaErr = ref('')
const tpl = ref(''); const tplOut = ref(null); const tplErr = ref(''); const cfg = ref(null)
const q = ref('')
const tplPlaceholder = 'Hi {{ name }}, your {{ bonus }} RC bonus is ready!'

async function loadDash() { try { dash.value = await get('/staff/dashboard') } catch { denied.value = true } }
onMounted(loadDash)
async function go(t) {
  tab.value = t
  try {
    if (t === 'players') players.value = await get('/staff/players?q=' + encodeURIComponent(q.value))
    if (t === 'moderation') mod.value = await get('/staff/moderation')
    if (t === 'kyc') kyc.value = await get('/staff/kyc-queue')
    if (t === 'admin') cfg.value = await get('/admin/config')
  } catch (e) { /* 403 handled by denied banner */ }
}
async function runFormula() {
  formulaErr.value = ''; formulaOut.value = null
  try { formulaOut.value = await post('/staff/promos/formula/preview', { formula: formula.value }) }
  catch (e) { formulaErr.value = e.message }
}
async function runTemplate() {
  tplErr.value = ''; tplOut.value = null
  try { tplOut.value = await post('/admin/email/preview', { template: tpl.value, context: { name: 'Player', bonus: 25 } }) }
  catch (e) { tplErr.value = e.message }
}
const TABS = [['dashboard', 'Dashboard'], ['players', 'Players'], ['moderation', 'Moderation'], ['kyc', 'KYC Queue'], ['formula', 'Bonus Formula']]
</script>

<template>
  <div v-if="denied" class="card warnbox">Staff access required. Your account is not authorised for the console.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Staff Console</h1><span class="badge staff">{{ me.role }}</span></div>
    <div class="tabs" style="max-width:640px">
      <button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button>
      <button v-if="isAdmin" :class="{ active: tab === 'admin' }" @click="go('admin')">Admin</button>
    </div>

    <!-- Dashboard -->
    <div v-if="tab === 'dashboard' && dash" class="grid g4">
      <div class="card stat"><div class="n">{{ dash.players }}</div><div class="l">Players</div></div>
      <div class="card stat"><div class="n green">{{ dash.deposits_today }}</div><div class="l">Deposits (RC)</div></div>
      <div class="card stat"><div class="n">{{ dash.open_tickets }}</div><div class="l">Open tickets</div></div>
      <div class="card stat"><div class="n gold">{{ dash.pending_kyc }}</div><div class="l">Pending KYC</div></div>
    </div>

    <!-- Players -->
    <div v-if="tab === 'players'" class="card">
      <div class="row" style="margin-bottom:12px"><input v-model="q" placeholder="search players…" style="flex:1" @keyup.enter="go('players')" />
        <button class="btn" @click="go('players')">Search</button></div>
      <table><thead><tr><th>ID</th><th>Player</th><th>Email</th><th>Role</th><th>KYC</th><th>Balance</th></tr></thead>
        <tbody><tr v-for="p in players" :key="p.id"><td>{{ p.id }}</td>
          <td><div class="row"><img class="avatar" :src="avatar(p.username, 26)" width="26" height="26" />{{ p.display_name }}</div></td>
          <td class="muted">{{ p.email }}</td><td><span class="badge" :class="p.role === 'player' ? 'silver' : 'staff'">{{ p.role }}</span></td>
          <td><span class="badge" :class="p.kyc_status === 'verified' ? 'ok' : 'warn'">{{ p.kyc_status }}</span></td><td>{{ p.balance }} RC</td></tr></tbody></table>
    </div>

    <!-- Moderation (renders user content for review) -->
    <div v-if="tab === 'moderation' && mod" class="grid g2" style="align-items:start">
      <div class="card"><h3>Chat review</h3>
        <div v-for="c in mod.chat" :key="c.id" class="chatline"><b>{{ c.username }}</b>: <span v-html="c.message"></span></div>
      </div>
      <div class="card"><h3>Feed review</h3>
        <div v-for="f in mod.feed" :key="f.id" class="chatline"><b>{{ f.username }}</b> ({{ f.game }}): <span v-html="f.note"></span></div>
      </div>
    </div>

    <!-- KYC -->
    <div v-if="tab === 'kyc'" class="card">
      <table><thead><tr><th>Doc</th><th>Player</th><th>Type</th><th>File</th><th>Status</th></tr></thead>
        <tbody><tr v-for="d in kyc" :key="d.id"><td>{{ d.id }}</td><td>{{ d.player_id }}</td><td>{{ d.type }}</td>
          <td class="muted mono">{{ d.filename }}</td><td><span class="badge warn">{{ d.status }}</span></td></tr></tbody></table>
      <div v-if="!kyc.length" class="muted">Queue empty.</div>
    </div>

    <!-- Bonus formula (V13) -->
    <div v-if="tab === 'formula'" class="card">
      <h3>Bonus formula</h3>
      <p class="muted" style="font-size:13px">Define the bonus payout as an expression. Variables: <span class="mono">deposit, streak, tier, losses, player</span>. Preview evaluates it live.</p>
      <textarea v-model="formula" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="runFormula">Preview</button>
      <div v-if="formulaOut" class="result mono" style="margin-top:12px">result = {{ formulaOut.result }}</div>
      <div v-if="formulaErr" class="err-inline" style="margin-top:10px">{{ formulaErr }}</div>
    </div>

    <!-- Admin -->
    <div v-if="tab === 'admin' && isAdmin" class="grid" style="gap:16px;align-items:start">
      <div class="card"><h3>Promo email template</h3>
        <p class="muted" style="font-size:13px">Template variables: <span v-pre class="mono">{{ name }}, {{ bonus }}</span>. Preview renders it.</p>
        <textarea v-model="tpl" class="mono" :placeholder="tplPlaceholder"></textarea>
        <button class="btn primary" style="margin-top:10px" @click="runTemplate">Render preview</button>
        <div v-if="tplOut" class="result" style="margin-top:12px">{{ tplOut.rendered }}</div>
        <div v-if="tplErr" class="err-inline" style="margin-top:10px">{{ tplErr }}</div>
      </div>
      <div class="card" v-if="cfg"><h3>Site configuration</h3>
        <table><tbody><tr v-for="(v, k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table>
      </div>
    </div>
  </template>
</template>
