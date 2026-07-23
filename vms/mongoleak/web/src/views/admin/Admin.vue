<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api'
const tab = ref('users'); const denied = ref(false)
const users = ref([]); const notes = ref([])
async function loadUsers() { try { users.value = await get('/admin/users') } catch { denied.value = true } }
onMounted(loadUsers)
async function go(t) { tab.value = t; try { if (t === 'notes') notes.value = await get('/admin/notes') } catch {} }
</script>
<template>
  <div class="content">
    <div v-if="denied" class="card" style="border-color:var(--warn)">Administrator access required.</div>
    <template v-else>
      <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge brand">admin</span></div>
      <div class="tabs" style="max-width:320px"><button :class="{ active: tab === 'users' }" @click="go('users')">Users</button><button :class="{ active: tab === 'notes' }" @click="go('notes')">All Notes</button></div>
      <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Email</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td>{{ u.username }}</td><td><span class="badge brand">{{ u.role }}</span></td><td class="muted">{{ u.email }}</td></tr></tbody></table></div>
      <div v-if="tab === 'notes'" class="card"><table><thead><tr><th>Owner</th><th>Title</th><th>Body</th></tr></thead>
        <tbody><tr v-for="n in notes" :key="n._id"><td>{{ n.owner }}</td><td>{{ n.title }}</td><td class="muted">{{ n.body }}</td></tr></tbody></table></div>
    </template>
  </div>
</template>
