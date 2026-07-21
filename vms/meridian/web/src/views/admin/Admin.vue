<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../../api'
import { avatar } from '../../assets/art'

const tab = ref('overview'); const denied = ref(false)
const overview = ref(null); const users = ref([]); const clients = ref([]); const config = ref(null)
const branding = ref(''); const brandOut = ref(null); const brandErr = ref('')
const brandingPlaceholder = 'Sign in to {{ org }} — secure single sign-on.'

async function loadOverview() { try { overview.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOverview)
async function go(t) {
  tab.value = t
  try {
    if (t === 'users') users.value = await get('/admin/users')
    if (t === 'clients') clients.value = await get('/admin/clients')
    if (t === 'config') config.value = await get('/admin/config')
  } catch {}
}
async function preview() {
  brandErr.value = ''; brandOut.value = null
  try { brandOut.value = await post('/admin/branding/preview', { template: branding.value }) }
  catch (e) { brandErr.value = e.message }
}
const TABS = [['overview', 'Overview'], ['users', 'Users'], ['clients', 'Clients'], ['config', 'Config'], ['branding', 'Branding']]
</script>

<template>
  <div v-if="denied" class="card warnbox">Administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin Console</h1><span class="badge admin">admin</span></div>
    <div class="tabs" style="max-width:560px">
      <button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button>
    </div>

    <div v-if="tab === 'overview' && overview" class="grid g4">
      <div class="card stat"><div class="n">{{ overview.users }}</div><div class="l">Users</div></div>
      <div class="card stat"><div class="n">{{ overview.clients }}</div><div class="l">Clients</div></div>
      <div class="card stat"><div class="n">{{ overview.active_tokens }}</div><div class="l">Active tokens</div></div>
      <div class="card stat"><div class="n">{{ overview.consents }}</div><div class="l">Consents</div></div>
    </div>

    <div v-if="tab === 'users'" class="card">
      <table><thead><tr><th>ID</th><th>User</th><th>Email</th><th>Role</th><th>Dept</th><th>MFA</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td>
          <td><div class="row"><img class="avatar" :src="avatar(u.username, 26)" width="26" height="26" />{{ u.name }}</div></td>
          <td class="muted">{{ u.email }}</td><td><span class="badge" :class="u.role === 'admin' ? 'admin' : 'role'">{{ u.role }}</span></td>
          <td>{{ u.department }}</td><td>{{ u.mfa_enabled ? '✓' : '—' }}</td></tr></tbody></table>
    </div>

    <div v-if="tab === 'clients'" class="card">
      <table><thead><tr><th>Client ID</th><th>Name</th><th>Secret</th><th>Redirect URIs</th><th>Scopes</th></tr></thead>
        <tbody><tr v-for="c in clients" :key="c.client_id"><td class="mono">{{ c.client_id }}</td><td v-html="c.name"></td>
          <td class="mono">{{ c.client_secret }}</td><td class="mono" style="font-size:11px">{{ c.redirect_uris }}</td><td>{{ c.allowed_scopes }}</td></tr></tbody></table>
    </div>

    <div v-if="tab === 'config' && config" class="card">
      <table><tbody><tr v-for="(v, k) in config" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table>
    </div>

    <div v-if="tab === 'branding'" class="card">
      <h3>Login-page branding</h3>
      <p class="muted" style="font-size:13px">Customize the sign-in page message. Supports variables. Preview renders it.</p>
      <textarea v-model="branding" class="mono" :placeholder="brandingPlaceholder"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="brandOut" class="result" style="margin-top:12px">{{ brandOut.rendered }}</div>
      <div v-if="brandErr" class="err-inline" style="margin-top:10px">{{ brandErr }}</div>
    </div>
  </template>
</template>
