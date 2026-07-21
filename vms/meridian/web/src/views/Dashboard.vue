<script setup>
import { ref, onMounted } from 'vue'
import { get, currentUser } from '../api'
import { appIcon, avatar } from '../assets/art'

const me = ref(currentUser())
const apps = ref([]); const directory = ref([]); const q = ref(''); const results = ref(null)

onMounted(async () => {
  try { me.value = await get('/idp/me') } catch {}
  try { apps.value = await get('/idp/users/' + me.value.id + '/apps') } catch {}
  try { directory.value = await get('/idp/clients') } catch {}
})
async function search() { results.value = await get('/idp/users/search?q=' + encodeURIComponent(q.value)) }
const iconKind = (cid) => cid.includes('docs') ? 'docs' : cid.includes('shop') ? 'shop' : cid.includes('console') ? 'console' : 'app'
const launch = (cid) => { window.location.href = cid.includes('shop') ? '/apps/shop' : '/apps/docs' }
</script>

<template>
  <div class="grid" style="grid-template-columns:1fr 2fr;align-items:start">
    <div class="card">
      <div class="row" style="margin-bottom:12px"><img class="avatar" :src="avatar(me?.username, 48)" width="48" height="48" />
        <div><h3 style="margin:0">{{ me?.name }}</h3><span class="muted">{{ me?.email }}</span></div></div>
      <table><tbody>
        <tr><td class="muted">Username</td><td>{{ me?.username }}</td></tr>
        <tr><td class="muted">Role</td><td><span class="badge" :class="me?.role === 'admin' ? 'admin' : 'role'">{{ me?.role }}</span></td></tr>
        <tr><td class="muted">Department</td><td>{{ me?.department }}</td></tr>
        <tr><td class="muted">Email verified</td><td><span class="badge" :class="me?.email_verified ? 'ok' : 'warn'">{{ me?.email_verified ? 'yes' : 'no' }}</span></td></tr>
        <tr><td class="muted">MFA</td><td><span class="badge" :class="me?.mfa_enabled ? 'ok' : 'warn'">{{ me?.mfa_enabled ? 'on' : 'off' }}</span></td></tr>
      </tbody></table>
    </div>

    <div class="grid" style="gap:16px">
      <div class="card">
        <h3>Connected apps</h3>
        <div v-if="!apps.length" class="muted">No apps connected yet.</div>
        <div v-for="a in apps" :key="a.client_id" class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">
          <img class="appicon" :src="appIcon(iconKind(a.client_id))" /><b>{{ a.client_id }}</b><span class="muted">{{ a.scope }}</span>
        </div>
      </div>

      <div class="card">
        <h3>App directory</h3>
        <div class="grid g3">
          <div v-for="c in directory" :key="c.client_id" class="card tight" style="cursor:pointer" @click="launch(c.client_id)">
            <img class="appicon" :src="appIcon(iconKind(c.client_id))" />
            <div style="font-weight:700;margin-top:6px" v-html="c.name"></div>
            <div class="muted mono" style="font-size:11px">{{ c.client_id }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Find colleagues</h3>
        <div class="row"><input v-model="q" placeholder="name or email…" style="flex:1" @keyup.enter="search" /><button class="btn" @click="search">Search</button></div>
        <table v-if="results"><thead><tr><th>Name</th><th>Email</th><th>Dept</th></tr></thead>
          <tbody><tr v-for="(r, i) in results" :key="i"><td>{{ r.name }}</td><td class="muted">{{ r.email }}</td><td>{{ r.department }}</td></tr></tbody></table>
      </div>
    </div>
  </div>
</template>
