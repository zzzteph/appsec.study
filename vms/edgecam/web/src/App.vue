<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo } from './assets/art'
import { currentUser, clearAuth } from './api'
const route = useRoute(); const router = useRouter()
const user = computed(() => currentUser())
function logout() { clearAuth(); router.push('/login') }
</script>
<template>
  <router-view v-if="route.meta.guest" />
  <template v-else>
    <nav class="topnav">
      <router-link to="/" class="brand" style="color:inherit"><img :src="logo(28)" /> EdgeCam NVR-2000</router-link>
      <router-link to="/">Live</router-link>
      <router-link to="/advanced">Advanced</router-link>
      <span class="grow"></span>
      <span class="pill">fw 3.1.4</span>
      <span class="muted" style="font-size:13px">{{ user?.username }}</span>
      <button class="btn ghost sm" @click="logout">Sign out</button>
    </nav>
    <main><router-view /></main>
  </template>
</template>
