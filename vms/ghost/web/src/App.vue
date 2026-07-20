<script setup>
import { ref, reactive, defineAsyncComponent } from 'vue'

// Loaded on demand — the dashboard + api client are in a separate chunk that the
// browser only fetches once you log in.
const Dashboard = defineAsyncComponent(() => import('./Dashboard.vue'))

const authed = ref(!!localStorage.getItem('g_tok'))
const form = reactive({ username: '', password: '' })
const err = ref('')

async function login() {
  err.value = ''
  try {
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'login failed')
    localStorage.setItem('g_tok', j.token)
    localStorage.setItem('g_user', JSON.stringify(j.user))
    authed.value = true
  } catch (e) { err.value = e.message }
}
function logout() { localStorage.removeItem('g_tok'); localStorage.removeItem('g_user'); authed.value = false }
</script>

<template>
  <div class="app">
    <nav>
      <span class="brand">👻 Ghost</span>
      <span class="tag">Order Management</span>
      <a v-if="authed" href="#" class="right" @click.prevent="logout">Logout</a>
    </nav>

    <div v-if="!authed" class="login">
      <div class="card">
        <h1>Sign in to your shop</h1>
        <input v-model="form.username" placeholder="username" />
        <input v-model="form.password" type="password" placeholder="password" @keyup.enter="login" />
        <button @click="login">Login</button>
        <p v-if="err" class="err">{{ err }}</p>
        <p class="muted">Demo account: <b>demo / demo</b></p>
      </div>
    </div>

    <Dashboard v-else />
  </div>
</template>
