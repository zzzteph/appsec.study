<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
import { avatar } from '../assets/art'

const org = ref(null); const members = ref([]); const invites = ref([])
onMounted(async () => {
  const orgs = await get('/orgs'); org.value = orgs[0]
  if (org.value) { members.value = await get('/orgs/' + org.value.id + '/members'); invites.value = await get('/orgs/' + org.value.id + '/invites') }
})
</script>

<template>
  <h1>Members</h1>
  <div v-if="org" class="muted" style="margin-bottom:14px">{{ org.name }} · {{ org.plan }} plan</div>
  <div class="card" style="margin-bottom:16px">
    <table><thead><tr><th>Member</th><th>Email</th><th>Role</th></tr></thead>
      <tbody><tr v-for="m in members" :key="m.id">
        <td><div class="row"><img class="avatar" :src="avatar(m.username, 28)" width="28" height="28" />{{ m.name }}</div></td>
        <td class="muted">{{ m.email }}</td><td><span class="badge" :class="m.role==='owner'?'owner':'role'">{{ m.role }}</span></td></tr></tbody></table>
  </div>
  <div class="card" v-if="invites.length">
    <h3>Pending invites</h3>
    <table><thead><tr><th>Email</th><th>Role</th><th>Status</th></tr></thead>
      <tbody><tr v-for="i in invites" :key="i.id"><td>{{ i.email }}</td><td>{{ i.role }}</td><td><span class="badge warn">{{ i.used ? 'used' : 'pending' }}</span></td></tr></tbody></table>
  </div>
</template>
