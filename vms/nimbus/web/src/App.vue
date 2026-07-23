<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearAuth, get } from './api'
const route = useRoute(); const router = useRouter()
const user = ref(currentUser())
const bare = computed(() => route.meta.guest || route.meta.open)
const isAdmin = computed(() => user.value && user.value.role === 'admin')
async function loadShell() { if (bare.value || !currentUser()) return; try { user.value = await get('/me') } catch { user.value = currentUser() } }
watch(() => route.fullPath, loadShell, { immediate: true })
function logout() { clearAuth(); router.push('/login') }
</script>
<template>
  <router-view v-if="bare" />
  <div v-else class="app">
    <aside class="side">
      <div class="brand"><img :src="logo(30)" /> Nimbus</div>
      <nav class="nav">
        <router-link to="/" :class="{ active: route.path === '/' }"><span class="ico">📁</span> My Files</router-link>
        <router-link to="/profile" :class="{ active: route.path === '/profile' }"><span class="ico">⚙</span> Account</router-link>
        <template v-if="isAdmin"><div class="sep"></div><div class="tag">Admin</div><router-link to="/admin" :class="{ active: route.path === '/admin' }"><span class="ico">🛡</span> Admin</router-link></template>
      </nav>
    </aside>
    <div class="main">
      <div v-if="isAdmin" class="staffbar">Administrator session</div>
      <header class="topbar"><div class="grow"></div>
        <router-link to="/profile" class="row" style="gap:8px"><img class="avatar" :src="avatar(user?.avatar_seed || user?.username, 34)" width="34" height="34" />
          <div style="line-height:1.1"><div style="font-weight:700;font-size:13px">{{ user?.name }}</div><span class="muted" style="font-size:12px">{{ user?.used_mb }} MB used</span></div></router-link>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </header>
      <main class="content"><router-view /></main>
    </div>
  </div>
</template>
