<template>
  <div class="auth">
    <div class="card">
      <div class="logo" style="margin-bottom:16px"><span class="m">✦</span> HelpDeskAI</div>
      <h1 style="margin:0 0 4px;font-size:23px">Sign in</h1>
      <p class="muted" style="margin:0 0 18px">Your AI support assistant is ready to help.</p>
      <form @submit.prevent="submit">
        <div class="field"><label>Username</label><input v-model="username" autofocus autocomplete="username" /></div>
        <div class="field"><label>Password</label><input v-model="password" type="password" autocomplete="current-password" /></div>
        <button style="width:100%" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
        <div v-if="err" class="err">{{ err }}</div>
      </form>
      <p class="muted" style="margin-top:16px;font-size:12.5px">Demo account: <code>demo</code> / <code>demo</code></p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post, setAuth } from '../api'
const username = ref('demo'); const password = ref('demo'); const busy = ref(false); const err = ref('')
const route = useRoute(); const router = useRouter()
async function submit(){
  busy.value = true; err.value = ''
  try { const r = await post('/login', { username: username.value, password: password.value }); setAuth(r.token, r.user); router.push(route.query.next || '/') }
  catch (e) { err.value = e.message } finally { busy.value = false }
}
</script>
