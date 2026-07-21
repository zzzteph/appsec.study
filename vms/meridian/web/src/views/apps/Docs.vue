<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { post } from '../../api'
import { appIcon, logo } from '../../assets/art'

const route = useRoute()
const session = ref(null); const err = ref('')

onMounted(async () => {
  if (route.query.code) {
    try { session.value = await post('/apps/docs/exchange', { code: route.query.code }) }
    catch (e) { err.value = e.message }
  }
})
function signin() {
  window.location.href = '/authorize?client_id=docs-app&redirect_uri=/apps/docs&scope=' + encodeURIComponent('openid profile email')
}
</script>

<template>
  <div class="content">
    <nav class="row" style="margin-bottom:24px"><img class="appicon" :src="appIcon('docs')" /><h2 style="margin:0">Meridian Docs</h2>
      <span class="grow"></span><a href="/">← back to Meridian ID</a></nav>

    <div v-if="err" class="card err-inline">{{ err }}</div>
    <div v-else-if="session" class="card">
      <div class="row" style="margin-bottom:8px"><h3 style="margin:0">Welcome, {{ session.name }}</h3><span class="grow"></span><span class="muted">{{ session.email }}</span></div>
      <p class="muted">Your documents:</p>
      <div v-for="d in session.docs" :key="d.id" class="card tight" style="margin-bottom:10px">
        <b>{{ d.title }}</b><div class="muted" style="font-size:13px">{{ d.body }}</div>
      </div>
      <div v-if="!session.docs.length" class="muted">No documents yet.</div>
    </div>
    <div v-else class="card center" style="flex-direction:column;gap:16px;padding:50px">
      <img :src="logo(48)" width="48" height="48" />
      <h3 style="margin:0">Sign in to Meridian Docs</h3>
      <p class="muted" style="text-align:center;max-width:360px">Collaborative documents for your team, secured with Meridian single sign-on.</p>
      <button class="btn primary" @click="signin">Sign in with Meridian</button>
    </div>
  </div>
</template>
