<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api'
import { avatar } from '../../assets/art'

const tab = ref('overview'); const denied = ref(false)
const overview = ref(null); const orgs = ref([]); const users = ref([]); const cfg = ref(null)
async function loadOverview() { try { overview.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOverview)
async function go(t) {
  tab.value = t
  try { if (t === 'orgs') orgs.value = await get('/admin/orgs'); if (t === 'users') users.value = await get('/admin/users'); if (t === 'config') cfg.value = await get('/admin/config') } catch {}
}
const TABS = [['overview', 'Overview'], ['orgs', 'Organizations'], ['users', 'Users'], ['config', 'Config']]
</script>

<template>
  <div v-if="denied" class="card warnbox">Platform administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Platform Admin</h1></div>
    <div class="tabs" style="max-width:520px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button></div>

    <div v-if="tab === 'overview' && overview" class="grid g4">
      <div class="card stat"><div class="n">{{ overview.orgs }}</div><div class="l">Orgs</div></div>
      <div class="card stat"><div class="n">{{ overview.users }}</div><div class="l">Users</div></div>
      <div class="card stat"><div class="n">{{ overview.projects }}</div><div class="l">Projects</div></div>
      <div class="card stat"><div class="n">{{ overview.tickets }}</div><div class="l">Tickets</div></div>
    </div>
    <div v-if="tab === 'orgs'" class="card"><table><thead><tr><th>ID</th><th>Name</th><th>Slug</th><th>Plan</th></tr></thead>
      <tbody><tr v-for="o in orgs" :key="o.id"><td>{{ o.id }}</td><td>{{ o.name }}</td><td class="mono">{{ o.slug }}</td><td><span class="badge role">{{ o.plan }}</span></td></tr></tbody></table></div>
    <div v-if="tab === 'users'" class="card"><table><thead><tr><th>User</th><th>Email</th><th>Platform role</th></tr></thead>
      <tbody><tr v-for="u in users" :key="u.id"><td><div class="row"><img class="avatar" :src="avatar(u.username, 26)" width="26" height="26" />{{ u.name }}</div></td><td class="muted">{{ u.email }}</td><td><span class="badge" :class="u.platform_role==='superadmin'?'owner':'role'">{{ u.platform_role }}</span></td></tr></tbody></table></div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
