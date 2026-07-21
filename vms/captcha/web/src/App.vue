<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { solvePow } from './pow.js'   // pre-login proof-of-work (does NOT pull in api.js / the RCE surface)

// Dashboard + api.js are code-split — loaded ONLY after a successful login.
const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'))

const loggedIn = ref(!!localStorage.getItem('cap_refresh'))
const username = ref('demo')
const password = ref('demo')
const loginErr = ref('')
const busy = ref(false)

// captcha widget state
const capId = ref('')
const nonce = ref(null)
const state = ref('idle')            // idle | checking | verified | challenge
const captchaToken = ref('')
const answer = ref('')
const capErr = ref('')

async function newCaptcha() {
  state.value = 'idle'; captchaToken.value = ''; answer.value = ''; capErr.value = ''; nonce.value = null
  const c = await (await fetch('/api/captcha')).json()
  capId.value = c.id
  // solve the proof-of-work up front so the checkbox click is instant for a real browser
  nonce.value = solvePow(c.pow.salt, c.pow.mask)
}

async function onCheck() {
  if (state.value === 'verified' || state.value === 'checking') return
  state.value = 'checking'; capErr.value = ''
  if (nonce.value == null) nonce.value = solvePow((await (await fetch('/api/captcha')).json()).pow?.salt || '', 0x1fff)
  const r = await fetch('/api/captcha/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: capId.value, nonce: nonce.value }) })
  const d = await r.json()
  if (d.ok) { captchaToken.value = d.token; state.value = 'verified' }
  else state.value = 'challenge'   // proof rejected → must read the image
}

async function submitChallenge() {
  capErr.value = ''
  const r = await fetch('/api/captcha/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: capId.value, answer: answer.value }) })
  const d = await r.json()
  if (d.ok) { captchaToken.value = d.token; state.value = 'verified' }
  else capErr.value = d.error || 'incorrect'
}

async function login() {
  loginErr.value = ''
  if (!captchaToken.value) { loginErr.value = 'Please complete the captcha.'; return }
  busy.value = true
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.value, password: password.value, captchaToken: captchaToken.value }) })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'login failed')
    localStorage.setItem('cap_access', d.access)
    localStorage.setItem('cap_refresh', d.refresh)
    localStorage.setItem('cap_user', username.value)
    loggedIn.value = true
  } catch (e) { loginErr.value = e.message; await newCaptcha() }   // captcha token is single-use → reset
  finally { busy.value = false }
}
function logout() { localStorage.removeItem('cap_access'); localStorage.removeItem('cap_refresh'); localStorage.removeItem('cap_user'); loggedIn.value = false; newCaptcha() }

onMounted(() => { if (!loggedIn.value) newCaptcha() })
</script>

<template>
  <div v-if="!loggedIn" class="login-wrap">
    <div class="card login">
      <div class="brand"><span class="logo">🧩</span> Captcha</div>
      <p class="muted">Sign in to access the console.</p>
      <label class="lbl">Username</label>
      <input class="field" v-model="username" autocomplete="username" />
      <label class="lbl">Password</label>
      <input class="field" v-model="password" type="password" autocomplete="current-password" @keyup.enter="login" />

      <!-- reCAPTCHA-style widget -->
      <div class="recaptcha">
        <div class="rc-check" @click="onCheck">
          <span v-if="state === 'checking'" class="spinner"></span>
          <span v-else-if="state === 'verified'" class="tick">✔</span>
          <span v-else class="box" :class="{ on: false }"></span>
        </div>
        <div class="rc-label">I'm not a robot</div>
        <div class="rc-logo">
          <div class="rc-mark">◎</div><div class="rc-brand">captcha</div>
        </div>
      </div>
      <div v-if="state === 'challenge'" class="challenge">
        <p class="muted">Type the digits you see:</p>
        <img :src="'/api/captcha/image/' + capId" alt="captcha" class="cap-img" />
        <div class="row">
          <input class="field" v-model="answer" inputmode="numeric" placeholder="5 digits" @keyup.enter="submitChallenge" />
          <button class="btn flat" @click="submitChallenge">Verify</button>
        </div>
        <p v-if="capErr" class="err">{{ capErr }}</p>
      </div>

      <button class="btn" :disabled="busy || !captchaToken" @click="login">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p v-if="loginErr" class="err">{{ loginErr }}</p>
      <p class="demo">Demo account: <code>demo / demo</code></p>
    </div>
  </div>
  <Dashboard v-else @logout="logout" />
</template>
