<script setup>
import { ref, defineAsyncComponent } from 'vue'

// The dashboard (and its API client, which references /api/run) is code-split: it loads ONLY after a
// successful login. An unauthenticated crawler of the initial bundle sees /api/login and nothing else.
const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'))

const loggedIn = ref(!!localStorage.getItem('lg_refresh'))
const username = ref('demo')
const password = ref('demo')
const captcha = ref(false)          // the "I'm not a robot" checkbox — must be ticked
const err = ref('')
const busy = ref(false)

async function login() {
  err.value = ''
  if (!captcha.value) { err.value = 'Please confirm you are not a robot.'; return }
  busy.value = true
  try {
    // inline fetch (this component does NOT import api.js, so api.js stays in the lazy chunk)
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value, captcha: captcha.value }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'login failed')
    localStorage.setItem('lg_access', d.access)
    localStorage.setItem('lg_refresh', d.refresh)
    localStorage.setItem('lg_user', username.value)
    loggedIn.value = true
  } catch (e) { err.value = e.message } finally { busy.value = false }
}
function logout() { localStorage.removeItem('lg_access'); localStorage.removeItem('lg_refresh'); localStorage.removeItem('lg_user'); loggedIn.value = false }
</script>

<template>
  <div v-if="!loggedIn" class="login-wrap">
    <div class="card login">
      <div class="brand"><span class="logo">🔐</span> Loggie</div>
      <p class="muted">Sign in to access the console.</p>
      <label class="lbl">Username</label>
      <input class="field" v-model="username" autocomplete="username" />
      <label class="lbl">Password</label>
      <input class="field" v-model="password" type="password" autocomplete="current-password" @keyup.enter="login" />
      <label class="captcha">
        <input type="checkbox" v-model="captcha" />
        <span>I'm not a robot</span>
      </label>
      <button class="btn" :disabled="busy" @click="login">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p v-if="err" class="err">{{ err }}</p>
      <p class="demo">Demo account: <code>demo / demo</code></p>
    </div>
  </div>
  <Dashboard v-else @logout="logout" />
</template>
