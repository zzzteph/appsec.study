<template>
  <div class="auth-wrap">
    <div class="card auth-card">
      <div class="brand" style="margin-bottom:14px"><span class="dot"></span> Streamline</div>
      <h1>Welcome back</h1>
      <p class="muted" style="margin:0 0 18px">Sign in to your workspace.</p>
      <form @submit.prevent="submit">
        <div class="field"><label>Username</label><input v-model="username" autocomplete="username" autofocus /></div>
        <div class="field"><label>Password</label><input v-model="password" type="password" autocomplete="current-password" /></div>
        <button style="width:100%" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
        <div v-if="err" class="err">{{ err }}</div>
      </form>
      <div class="demo">Demo workspace — try <code>demo</code> / <code>demo</code></div>
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
  try {
    const r = await post('/auth/login', { username: username.value, password: password.value })
    setAuth(r.access, r.user)
    router.push(route.query.next || '/')
  } catch (e) { err.value = e.message } finally { busy.value = false }
}
</script>
