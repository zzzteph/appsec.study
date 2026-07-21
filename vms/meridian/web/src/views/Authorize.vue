<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../api'
import { logo, appIcon } from '../assets/art'

const route = useRoute()
const info = ref(null); const err = ref('')
const p = route.query

onMounted(async () => {
  try {
    info.value = await get(`/oauth/authorize?client_id=${encodeURIComponent(p.client_id)}&redirect_uri=${encodeURIComponent(p.redirect_uri)}&scope=${encodeURIComponent(p.scope || 'openid profile')}&state=${encodeURIComponent(p.state || '')}&prompt=consent`)
  } catch (e) { err.value = e.message }
})
async function decide(approve) {
  const d = await post('/oauth/authorize/decision', { client_id: p.client_id, redirect_uri: p.redirect_uri, scope: p.scope || 'openid profile', state: p.state || '', approve })
  window.location.href = d.redirect
}
</script>

<template>
  <div class="consent card">
    <div class="center" style="flex-direction:column;gap:8px;margin-bottom:16px"><img :src="logo(44)" width="44" height="44" /><h3 style="margin:0">Authorize access</h3></div>
    <div v-if="err" class="err-inline">{{ err }}</div>
    <template v-else-if="info">
      <div class="row center" style="margin-bottom:14px">
        <img class="appicon" :src="appIcon('app')" />
        <!-- application name shown to the user -->
        <div><b v-html="info.client.name"></b><div class="muted" style="font-size:12px">wants to access your account</div></div>
      </div>
      <div class="warnbox" style="margin-bottom:16px">This app will receive: <b>{{ info.scope }}</b></div>
      <div class="row"><button class="btn ghost grow" @click="decide(false)">Deny</button><button class="btn primary grow" @click="decide(true)">Allow</button></div>
    </template>
  </div>
</template>
