<script setup>
import { ref } from 'vue'
import { get, post } from './api.js'

const user = ref(JSON.parse(localStorage.getItem('l2_user') || 'null'))
const lu = ref('demo'); const lp = ref(''); const loginErr = ref('')

const url = ref('https://example.com/health')
const method = ref('GET')
const hdrs = ref('{}')
const body = ref('')
const resp = ref(null); const reqErr = ref('')

async function doLogin() {
  loginErr.value = ''
  try {
    const r = await post('/login', { username: lu.value, password: lp.value })
    localStorage.setItem('l2_tok', r.token); localStorage.setItem('l2_user', JSON.stringify(r.user))
    user.value = r.user
  } catch (e) { loginErr.value = e.message }
}
function logout() {
  localStorage.removeItem('l2_tok'); localStorage.removeItem('l2_user'); user.value = null; resp.value = null
}
async function send() {
  reqErr.value = ''; resp.value = null
  let headers = {}
  try { headers = hdrs.value.trim() ? JSON.parse(hdrs.value) : {} } catch (e) { reqErr.value = 'headers must be JSON: ' + e.message; return }
  try {
    resp.value = await post('/fetch', {
      url: url.value, method: method.value, headers,
      body: (method.value === 'GET' || method.value === 'HEAD') ? undefined : body.value,
    })
  } catch (e) { reqErr.value = e.message }
}
</script>

<template>
  <header>
    <span class="brand">Latty<span class="ops">Ops</span></span>
    <span class="sub">internal request tester</span>
    <nav v-if="user"><span class="who">{{ user.username }}</span><a @click="logout">sign out</a></nav>
  </header>

  <main>
    <section v-if="!user" class="card narrow">
      <h2>Sign in</h2>
      <input v-model="lu" placeholder="username" />
      <input v-model="lp" type="password" placeholder="password" @keyup.enter="doLogin" />
      <button @click="doLogin">Sign in</button>
      <p v-if="loginErr" class="err">{{ loginErr }}</p>
      <p class="muted">Demo account: <code>demo / demo</code></p>
    </section>

    <section v-else>
      <div class="card">
        <h2>HTTP request tester</h2>
        <p class="muted">Fire a request from the ops box and inspect the response. Used to health-check
          our services and webhooks.</p>
        <div class="row">
          <select v-model="method">
            <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>HEAD</option>
          </select>
          <input v-model="url" placeholder="https://…" @keyup.enter="send" />
          <button @click="send">Send</button>
        </div>
        <label>Headers (JSON)</label>
        <textarea v-model="hdrs" rows="3"></textarea>
        <label v-if="method !== 'GET' && method !== 'HEAD'">Body</label>
        <textarea v-if="method !== 'GET' && method !== 'HEAD'" v-model="body" rows="3"></textarea>
        <p v-if="reqErr" class="err">{{ reqErr }}</p>
      </div>

      <div v-if="resp" class="card">
        <h3>Response · <span class="status">{{ resp.status }}</span></h3>
        <label>Headers</label>
        <pre class="out">{{ JSON.stringify(resp.headers, null, 2) }}</pre>
        <label>Body</label>
        <pre class="out">{{ resp.body }}</pre>
      </div>
    </section>
  </main>
</template>
