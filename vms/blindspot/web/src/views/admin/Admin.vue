<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../../api'
const tab = ref('feedback'); const denied = ref(false)
const feedback = ref([]); const users = ref([]); const host = ref('localhost'); const log = ref(''); const diagMsg = ref('')
async function loadFb() { try { feedback.value = await get('/admin/feedback') } catch { denied.value = true } }
onMounted(loadFb)
async function go(t) { tab.value = t; try { if (t === 'users') users.value = await get('/admin/users'); if (t === 'feedback') feedback.value = await get('/admin/feedback') } catch {} }
async function runDiag() { diagMsg.value = ''; log.value = ''; const d = await post('/admin/diag', { host: host.value }); diagMsg.value = d.message; log.value = await get('/admin/diag/log') }
</script>
<template>
  <div class="content">
    <div v-if="denied" class="card" style="border-color:var(--warn)">Administrator access required.</div>
    <template v-else>
      <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge brand">admin</span></div>
      <div class="tabs" style="max-width:420px"><button :class="{ active: tab === 'feedback' }" @click="go('feedback')">Feedback</button><button :class="{ active: tab === 'users' }" @click="go('users')">Users</button><button :class="{ active: tab === 'diag' }" @click="go('diag')">Diagnostics</button></div>
      <div v-if="tab === 'feedback'" class="card">
        <h3>Customer feedback</h3>
        <div v-for="f in feedback" :key="f.id" class="comment"><b>{{ f.username }}</b> <span class="muted" style="font-size:12px">· {{ f.subject }}</span><div v-html="f.body"></div></div>
      </div>
      <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Email</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td>{{ u.username }}</td><td><span class="badge" :class="u.role==='admin'?'brand':'ok'">{{ u.role }}</span></td><td class="muted">{{ u.email }}</td></tr></tbody></table></div>
      <div v-if="tab === 'diag'" class="card">
        <h3>Network diagnostics</h3>
        <p class="muted" style="font-size:13px">Ping a host to check connectivity. Results are written to the diagnostics log.</p>
        <div class="row"><input v-model="host" placeholder="host" style="flex:1" /><button class="btn primary" @click="runDiag">Run</button></div>
        <div v-if="diagMsg" class="badge ok" style="margin-top:10px">{{ diagMsg }}</div>
        <div v-if="log" class="result" style="margin-top:10px">{{ log }}</div>
      </div>
    </template>
  </div>
</template>
