<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearAuth, get } from './api'

const route = useRoute(); const router = useRouter()
const user = ref(currentUser()); const orgs = ref([])
const isGuest = computed(() => route.meta.guest)
const isSuper = computed(() => user.value && user.value.platform_role === 'superadmin')
const currentOrg = computed(() => orgs.value[0])

async function loadShell() {
  if (isGuest.value || !currentUser()) return
  user.value = currentUser()
  try { orgs.value = await get('/orgs') } catch {}
}
watch(() => route.fullPath, loadShell, { immediate: true })
function logout() { clearAuth(); router.push('/login') }
</script>

<template>
  <router-view v-if="isGuest" />
  <div v-else class="app">
    <aside class="side">
      <div class="brand"><img :src="logo(28)" /> TenantHub</div>
      <div v-if="currentOrg" class="orgpick"><div class="name">{{ currentOrg.name }}</div><span class="plan">{{ currentOrg.plan }} · {{ currentOrg.role }}</span></div>
      <nav class="nav">
        <router-link to="/" :class="{ active: route.path === '/' }">🗂 Projects</router-link>
        <router-link to="/members" :class="{ active: route.path === '/members' }">👥 Members</router-link>
        <template v-if="isSuper"><div class="sep"></div><div class="tag">Platform</div>
          <router-link to="/admin" :class="{ active: route.path === '/admin' }">🛡 Admin</router-link></template>
      </nav>
    </aside>
    <div class="main">
      <div v-if="isSuper" class="staffbar">Platform administrator</div>
      <header class="topbar">
        <div class="grow"></div>
        <img class="avatar" :src="avatar(user?.avatar_seed || user?.username, 30)" width="30" height="30" />
        <div style="line-height:1.1"><div style="font-weight:700;font-size:13px">{{ user?.name }}</div><span class="muted" style="font-size:12px">{{ user?.email }}</span></div>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </header>
      <main class="content"><router-view /></main>
    </div>
  </div>
</template>
