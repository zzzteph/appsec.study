<template>
  <div>
    <nav class="nav" v-if="!isAuth">
      <div class="in">
        <router-link to="/" class="logo"><span class="m">✦</span> HelpDeskAI</router-link>
        <router-link to="/">Assistant</router-link>
        <router-link to="/kb">Knowledge base</router-link>
        <router-link to="/tickets">Tickets</router-link>
        <router-link to="/account">Account</router-link>
        <div class="spacer"></div>
        <span class="muted" v-if="me">{{ me.name }} · <span class="pill" :class="{pro: me.plan==='Pro'}">{{ me.plan }}</span></span>
        <button class="ghost sm" @click="logout">Sign out</button>
      </div>
    </nav>
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
