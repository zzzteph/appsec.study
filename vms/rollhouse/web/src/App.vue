<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearAuth, get, refresh } from './api'

const route = useRoute()
const router = useRouter()
const user = ref(currentUser())
const wallet = ref(null)
const isGuest = computed(() => route.meta.guest)
const isStaff = computed(() => user.value && (user.value.role === 'staff' || user.value.role === 'admin'))

const nav = [
  ['/', '🎰', 'Casino'], ['/cashier', '💳', 'Cashier'], ['/promotions', '🎁', 'Promotions'],
  ['/vip', '💎', 'VIP Club'], ['/social', '💬', 'Community'], ['/inbox', '✉️', 'Inbox'], ['/profile', '⚙️', 'Account'],
]

async function loadShell() {
  if (isGuest.value || !currentUser()) return
  user.value = currentUser()
  try { wallet.value = await get('/wallet') } catch {}
}
watch(() => route.fullPath, loadShell, { immediate: true })

function logout() { clearAuth(); router.push('/login') }
</script>

<template>
  <router-view v-if="isGuest" />
  <div v-else class="app">
    <aside class="side">
      <div class="brand"><img class="logo" :src="logo(34)" /> RollHouse</div>
      <nav class="nav">
        <router-link v-for="n in nav" :key="n[0]" :to="n[0]" :class="{ active: route.path === n[0] }">
          <span class="ico">{{ n[1] }}</span> {{ n[2] }}
        </router-link>
        <template v-if="isStaff">
          <div class="sep"></div>
          <div class="tag">Staff</div>
          <router-link to="/staff" :class="{ active: route.path === '/staff' }"><span class="ico">🛡️</span> Staff Console</router-link>
        </template>
      </nav>
    </aside>

    <div class="main">
      <div v-if="isStaff" class="staffbar">Staff mode — internal tools active</div>
      <header class="topbar">
        <div class="grow"></div>
        <div v-if="wallet" class="pill bal">🪙 {{ wallet.balance?.toFixed(2) }} RC
          <span v-if="wallet.bonus_balance" class="muted">+ {{ wallet.bonus_balance?.toFixed(2) }} bonus</span>
        </div>
        <router-link to="/cashier" class="btn gold sm">＋ Deposit</router-link>
        <router-link to="/profile" class="row" style="gap:8px">
          <img class="avatar" :src="avatar(user?.avatar_seed || user?.username, 34)" width="34" height="34" />
          <div style="line-height:1.1">
            <div style="font-weight:800;font-size:13px">{{ user?.display_name || user?.username }}</div>
            <span class="badge" :class="user?.vip_tier">{{ user?.vip_tier }}</span>
          </div>
        </router-link>
        <button class="btn ghost sm" @click="logout">Logout</button>
      </header>
      <main class="content"><router-view /></main>
    </div>
  </div>
</template>
