<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logo, avatar } from './assets/art'
import { currentUser, clearUser, post } from './api'

const route = useRoute(); const router = useRouter()
const bare = computed(() => route.meta.guest || route.path.startsWith('/apps'))
const user = computed(() => currentUser())
const isAdmin = computed(() => user.value && user.value.role === 'admin')

async function logout() { try { await post('/idp/logout') } catch {} clearUser(); router.push('/login') }
</script>

<template>
  <router-view v-if="bare" />
  <template v-else>
    <div v-if="isAdmin" class="staffbar">Administrator session</div>
    <nav class="topnav">
      <router-link to="/" class="brand" style="color:inherit"><img :src="logo(30)" /> Meridian ID</router-link>
      <router-link to="/">Dashboard</router-link>
      <a href="/apps/docs">Apps</a>
      <router-link v-if="isAdmin" to="/admin">Admin</router-link>
      <span class="grow"></span>
      <template v-if="user">
        <img class="avatar" :src="avatar(user.avatar_seed || user.username, 32)" width="32" height="32" />
        <div style="line-height:1.1"><div style="font-weight:700;font-size:13px">{{ user.name }}</div><span class="muted" style="font-size:12px">{{ user.email }}</span></div>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </template>
    </nav>
    <main class="content"><router-view /></main>
  </template>
</template>
