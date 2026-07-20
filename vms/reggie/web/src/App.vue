<script setup>
import { ref, defineAsyncComponent } from 'vue'

// Dashboard + its API client (which reference /api/run) are code-split: they load ONLY after login.
const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'))

const loggedIn = ref(!!localStorage.getItem('rg_refresh'))
const mode = ref('register')        // no account exists — start on the registration form
const username = ref('')
const password = ref('')
const captcha = ref(false)
const err = ref('')
const note = ref('')
const busy = ref(false)

async function register() {
  err.value = ''; note.value = ''
  if (!captcha.value) { err.value = 'Please confirm you are not a robot.'; return }
  busy.value = true
  try {
    const r = await fetch('/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value, captcha: captcha.value }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'registration failed')
    note.value = 'Account created — please sign in.'
    mode.value = 'login'; captcha.value = false
  } catch (e) { err.value = e.message } finally { busy.value = false }
}

async function login() {
  err.value = ''
  if (!captcha.value) { err.value = 'Please confirm you are not a robot.'; return }
  busy.value = true
  try {
    // inline fetch (App does not import api.js, so api.js stays in the lazy chunk)
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value, captcha: captcha.value }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'login failed')
    localStorage.setItem('rg_access', d.access)
    localStorage.setItem('rg_refresh', d.refresh)
    localStorage.setItem('rg_user', username.value)
    loggedIn.value = true
  } catch (e) { err.value = e.message } finally { busy.value = false }
}
function logout() { localStorage.removeItem('rg_access'); localStorage.removeItem('rg_refresh'); localStorage.removeItem('rg_user'); loggedIn.value = false }
function swap(m) { mode.value = m; err.value = ''; note.value = '' }
</script>

<template>
  <div v-if="!loggedIn" class="login-wrap">
    <div class="card login">
      <div class="brand"><span class="logo">📝</span> Reggie</div>

      <template v-if="mode === 'register'">
        <p class="muted">Create an account to continue.</p>
        <label class="lbl">Username</label>
        <input class="field" v-model="username" autocomplete="username" />
        <label class="lbl">Password</label>
        <input class="field" v-model="password" type="password" autocomplete="new-password" @keyup.enter="register" />
        <label class="captcha"><input type="checkbox" v-model="captcha" /><span>I'm not a robot</span></label>
        <button class="btn" :disabled="busy" @click="register">{{ busy ? 'Creating…' : 'Create account' }}</button>
        <p class="alt">Already have an account? <a @click="swap('login')">Sign in</a></p>
      </template>

      <template v-else>
        <p class="muted">Sign in to access the console.</p>
        <label class="lbl">Username</label>
        <input class="field" v-model="username" autocomplete="username" />
        <label class="lbl">Password</label>
        <input class="field" v-model="password" type="password" autocomplete="current-password" @keyup.enter="login" />
        <label class="captcha"><input type="checkbox" v-model="captcha" /><span>I'm not a robot</span></label>
        <button class="btn" :disabled="busy" @click="login">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
        <p class="alt">Need an account? <a @click="swap('register')">Register</a></p>
      </template>

      <p v-if="note" class="note">{{ note }}</p>
      <p v-if="err" class="err">{{ err }}</p>
    </div>
  </div>
  <Dashboard v-else @logout="logout" />
</template>
