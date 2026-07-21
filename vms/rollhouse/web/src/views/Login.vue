<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post, setAuth } from '../api'
import { logo } from '../assets/art'

const route = useRoute(); const router = useRouter()
const tab = ref('login')
const f = ref({ username: '', email: '', password: '' })
const err = ref(''); const note = ref(''); const busy = ref(false)

async function submit() {
  err.value = ''; note.value = ''; busy.value = true
  try {
    if (tab.value === 'login') {
      const d = await post('/auth/login', { username: f.value.username, password: f.value.password })
      setAuth(d.access, d.user); router.push(route.query.next || '/')
    } else if (tab.value === 'register') {
      const d = await post('/auth/register', f.value)
      setAuth(d.access, d.user); router.push('/')
    } else {
      await post('/auth/reset', { email: f.value.email })
      note.value = 'If that account exists, a reset link was sent to its inbox.'
    }
  } catch (e) { err.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="auth">
    <div class="box">
      <div class="center" style="flex-direction:column;gap:8px;margin-bottom:22px">
        <img class="logo-big" :src="logo(56)" />
        <h1 style="margin:0">RollHouse</h1>
        <div class="muted">Play bold. Win big.</div>
      </div>
      <div class="card">
        <div class="tabs">
          <button :class="{ active: tab === 'login' }" @click="tab = 'login'">Log in</button>
          <button :class="{ active: tab === 'register' }" @click="tab = 'register'">Register</button>
          <button :class="{ active: tab === 'reset' }" @click="tab = 'reset'">Reset</button>
        </div>

        <form @submit.prevent="submit">
          <template v-if="tab !== 'reset'">
            <div class="field"><label>Username</label><input v-model="f.username" autocomplete="username" placeholder="your handle" /></div>
          </template>
          <div v-if="tab === 'register' || tab === 'reset'" class="field">
            <label>Email</label><input v-model="f.email" type="email" placeholder="you@example.com" />
          </div>
          <div v-if="tab !== 'reset'" class="field">
            <label>Password</label><input v-model="f.password" type="password" autocomplete="current-password" placeholder="••••••••" />
          </div>
          <div v-if="err" class="err-inline" style="margin-bottom:10px">{{ err }}</div>
          <div v-if="note" class="badge ok" style="margin-bottom:10px">{{ note }}</div>
          <button class="btn primary" style="width:100%" :disabled="busy">
            {{ busy ? '…' : (tab === 'login' ? 'Log in' : tab === 'register' ? 'Create account' : 'Send reset link') }}
          </button>
        </form>
      </div>
      <div class="center muted" style="margin-top:16px;font-size:13px">Demo account — <b>demo</b> / <b>demo</b></div>
    </div>
  </div>
</template>
