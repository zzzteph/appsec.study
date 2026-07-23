<template>
  <div class="app">
    <div class="top" v-if="!isAuth">
      <router-link to="/" class="brand"><span class="dot"></span> Streamline</router-link>
      <span class="pill">Realtime</span>
      <div class="spacer"></div>
      <span class="muted" v-if="me">{{ me.name || me.username }}</span>
      <router-link v-if="me && me.role==='admin'" to="/admin"><button class="ghost sm">Admin</button></router-link>
      <button class="ghost sm" @click="logout">Sign out</button>
    </div>
    <router-view />
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser, clearAuth } from './api'
const route = useRoute(); const router = useRouter()
const isAuth = computed(() => route.meta.guest)
const me = computed(() => currentUser())
function logout(){ clearAuth(); router.push('/login') }
</script>
