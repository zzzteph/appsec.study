<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api'
import { avatar } from '../../assets/art'
const tab = ref('overview'); const denied = ref(false)
const ov = ref(null); const users = ref([]); const queries = ref([]); const cfg = ref(null)
async function loadOv() { try { ov.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOv)
async function go(t) { tab.value = t; try { if (t === 'users') users.value = await get('/admin/users'); if (t === 'queries') queries.value = await get('/admin/queries'); if (t === 'config') cfg.value = await get('/admin/config') } catch {} }
const TABS = [['overview', 'Overview'], ['users', 'Users'], ['queries', 'Query Review'], ['config', 'Config']]
</script>
<template>
  <div v-if="denied" class="card" style="border-color:var(--warn)">Administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge brand">admin</span></div>
    <div class="tabs" style="max-width:520px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button></div>
    <div v-if="tab === 'overview' && ov" class="grid g3">
      <div class="card stat"><div class="n">{{ ov.users }}</div><div class="l">Users</div></div>
      <div class="card stat"><div class="n">{{ ov.dashboards }}</div><div class="l">Dashboards</div></div>
      <div class="card stat"><div class="n">{{ ov.queries }}</div><div class="l">Saved queries</div></div>
    </div>
    <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>User</th><th>Email</th><th>Role</th></tr></thead>
      <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td><div class="row"><img class="avatar" :src="avatar(u.username, 26)" width="26" height="26" />{{ u.name }}</div></td><td class="muted">{{ u.email }}</td><td><span class="badge brand">{{ u.role }}</span></td></tr></tbody></table></div>
    <div v-if="tab === 'queries'" class="card"><h3>Saved queries (all users)</h3>
      <div v-for="q in queries" :key="q.id" class="qrow"><span class="muted" style="font-size:12px">#{{ q.owner_id }}</span> <span v-html="q.name"></span><div class="muted" style="font-size:13px" v-html="q.description"></div></div>
    </div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
