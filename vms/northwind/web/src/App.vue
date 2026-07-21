<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearAuth, get } from './api'

const route = useRoute(); const router = useRouter()
const user = ref(currentUser())
const isGuest = computed(() => route.meta.guest)
const isStaff = computed(() => user.value && (user.value.role === 'staff' || user.value.role === 'admin'))
const nav = [['/', '▨', 'Overview'], ['/transfer', '⇄', 'Transfer'], ['/statements', '▤', 'Statements'], ['/inbox', '✉', 'Inbox'], ['/support', '☎', 'Support'], ['/profile', '⚙', 'Profile']]

async function loadShell() { if (isGuest.value || !currentUser()) return; try { user.value = await get('/me') } catch { user.value = currentUser() } }
watch(() => route.fullPath, loadShell, { immediate: true })
function logout() { clearAuth(); router.push('/login') }
</script>

<template>
  <router-view v-if="isGuest" />
  <div v-else class="app">
    <aside class="side">
      <div class="brand"><img :src="logo(32)" /> Northwind</div>
      <nav class="nav">
        <router-link v-for="n in nav" :key="n[0]" :to="n[0]" :class="{ active: route.path === n[0] }"><span class="ico">{{ n[1] }}</span> {{ n[2] }}</router-link>
        <template v-if="isStaff"><div class="sep"></div><div class="tag">Staff</div>
          <router-link to="/staff" :class="{ active: route.path === '/staff' }"><span class="ico">🛡</span> Back Office</router-link></template>
      </nav>
    </aside>
    <div class="main">
      <div v-if="isStaff" class="staffbar">Staff back-office session</div>
      <header class="topbar">
        <div class="grow"></div>
        <router-link to="/profile" class="row" style="gap:8px">
          <img class="avatar" :src="avatar(user?.avatar_seed || user?.username, 34)" width="34" height="34" />
          <div style="line-height:1.1"><div style="font-weight:700;font-size:13px">{{ user?.name }}</div><span class="muted" style="font-size:12px">{{ user?.tier }}</span></div>
        </router-link>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </header>
      <main class="content"><router-view /></main>
    </div>
  </div>
</template>
