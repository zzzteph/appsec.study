<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api'
const tab = ref('users'); const denied = ref(false)
const users = ref([]); const workflows = ref([])
async function loadUsers() { try { users.value = await get('/admin/users') } catch { denied.value = true } }
onMounted(loadUsers)
async function go(t) { tab.value = t; try { if (t === 'workflows') workflows.value = await get('/admin/workflows') } catch {} }
</script>
<template>
  <div class="content">
    <div v-if="denied" class="card" style="border-color:var(--warn)">Administrator access required.</div>
    <template v-else>
      <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge brand">admin</span></div>
      <div class="tabs" style="max-width:320px"><button :class="{ active: tab === 'users' }" @click="go('users')">Users</button><button :class="{ active: tab === 'workflows' }" @click="go('workflows')">Workflows</button></div>
      <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Email</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td>{{ u.username }}</td><td><span class="badge brand">{{ u.role }}</span></td><td class="muted">{{ u.email }}</td></tr></tbody></table></div>
      <div v-if="tab === 'workflows'" class="card"><h3>All workflows</h3>
        <div v-for="w in workflows" :key="w.id" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="muted" style="font-size:12px">{{ w.owner }}</span> <span v-html="w.name"></span><div class="muted" style="font-size:13px">{{ w.description }}</div></div></div>
    </template>
  </div>
</template>
