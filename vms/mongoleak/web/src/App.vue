<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo } from './assets/art'
import { currentUser, clearAuth } from './api'
const route = useRoute(); const router = useRouter()
const user = computed(() => currentUser())
const isAdmin = computed(() => user.value && user.value.role === 'admin')
function logout() { clearAuth(); router.push('/login') }
</script>
<template>
  <router-view v-if="route.meta.guest" />
  <template v-else>
    <div v-if="isAdmin" class="staffbar">Administrator session</div>
    <nav class="topnav">
      <router-link to="/" class="brand" style="color:inherit"><img :src="logo(28)" /> Notely</router-link>
      <router-link to="/">Notes</router-link>
      <router-link to="/profile">Account</router-link>
      <router-link v-if="isAdmin" to="/admin">Admin</router-link>
      <span class="grow"></span>
      <span class="muted" style="font-size:13px">{{ user?.username }}</span>
      <button class="btn ghost sm" @click="logout">Sign out</button>
    </nav>
    <main><router-view /></main>
  </template>
</template>
