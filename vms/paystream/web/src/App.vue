<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearAuth, get } from './api'
const route = useRoute(); const router = useRouter()
const user = ref(currentUser())
const isGuest = computed(() => route.meta.guest)
const isAdmin = computed(() => user.value && user.value.role === 'admin')
const nav = [['/', '💵', 'Home'], ['/directory', '👥', 'Directory'], ['/profile', '⚙', 'Account']]
async function loadShell() { if (isGuest.value || !currentUser()) return; try { user.value = await get('/me') } catch { user.value = currentUser() } }
watch(() => route.fullPath, loadShell, { immediate: true })
function logout() { clearAuth(); router.push('/login') }
</script>
<template>
  <router-view v-if="isGuest" />
  <div v-else class="app">
    <aside class="side">
      <div class="brand"><img :src="logo(28)" /> Paystream</div>
      <nav class="nav">
        <router-link v-for="n in nav" :key="n[0]" :to="n[0]" :class="{ active: route.path === n[0] }"><span>{{ n[1] }}</span> {{ n[2] }}</router-link>
        <template v-if="isAdmin"><div class="sep"></div><div class="tag">HR</div><router-link to="/admin" :class="{ active: route.path === '/admin' }"><span>🛡</span> HR Console</router-link></template>
      </nav>
    </aside>
    <div class="main">
      <div v-if="isAdmin" class="staffbar">HR administrator session</div>
      <header class="topbar"><div class="grow"></div>
        <router-link to="/profile" class="row" style="gap:8px"><img class="avatar" :src="avatar(user?.avatar_seed || user?.username, 32)" width="32" height="32" /><div style="line-height:1.1"><div style="font-weight:700;font-size:13px">{{ user?.name }}</div><span class="muted" style="font-size:12px">{{ user?.title }}</span></div></router-link>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </header>
      <main class="content"><router-view /></main>
    </div>
  </div>
</template>
