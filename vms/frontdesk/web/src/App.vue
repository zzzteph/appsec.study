<template>
  <div>
    <nav class="nav" v-if="!isAuth">
      <div class="in">
        <router-link to="/" class="logo"><span class="m"></span> FrontDesk</router-link>
        <router-link to="/">Stays</router-link>
        <router-link to="/account" v-if="me">My trips</router-link>
        <div class="spacer"></div>
        <span class="muted" v-if="me">{{ me.name }} · <span class="pill" :class="{gold: me.tier==='Gold'}">{{ me.tier }}</span></span>
        <button v-if="me" class="ghost sm" @click="logout">Sign out</button>
        <router-link v-else to="/login"><button class="sm">Sign in</button></router-link>
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
