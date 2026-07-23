<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo } from './assets/art'
import { currentUser, clearAuth } from './api'
const route = useRoute(); const router = useRouter()
const user = computed(() => currentUser())
const isAdmin = computed(() => user.value && user.value.role === 'admin')
function logout() { clearAuth(); router.push('/') }
</script>
<template>
  <div v-if="isAdmin" class="staffbar">Administrator session</div>
  <nav class="topnav">
    <router-link to="/" class="brand" style="color:inherit"><img :src="logo(30)" /> Trackr</router-link>
    <router-link to="/">Track</router-link>
    <router-link v-if="user" to="/account">My Account</router-link>
    <router-link v-if="isAdmin" to="/admin">Admin</router-link>
    <span class="grow"></span>
    <template v-if="user"><span class="muted" style="font-size:13px">{{ user.username }}</span><button class="btn ghost sm" @click="logout">Sign out</button></template>
    <router-link v-else to="/login" class="btn primary sm">Sign in</router-link>
  </nav>
  <main><router-view /></main>
</template>
