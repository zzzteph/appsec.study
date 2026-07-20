<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from './api.js'

const view = ref('home')          // home | post | login | admin
const posts = ref([])
const current = ref(null)
const query = ref('')
const results = ref(null)
const user = ref(JSON.parse(localStorage.getItem('l1_user') || 'null'))

// login form
const lu = ref(''); const lp = ref(''); const loginErr = ref('')

// report generator
const tpl = ref('')
const rdata = ref('{\n  "number": "INV-1042",\n  "customer": "Acme Corp",\n  "items": 3,\n  "amount": 250\n}')
const output = ref(''); const genErr = ref('')
const ph = '{{ placeholders }}'   // shown as a hint; kept in script so the SFC compiler doesn't parse the braces

async function loadPosts() { posts.value = await get('/posts') }
async function openPost(id) { current.value = await get('/posts/' + id); view.value = 'post' }
async function runSearch() {
  results.value = null
  try { results.value = await get('/search?q=' + encodeURIComponent(query.value)) }
  catch (e) { results.value = { error: e.message } }
}
async function doLogin() {
  loginErr.value = ''
  try {
    const r = await post('/login', { username: lu.value, password: lp.value })
    localStorage.setItem('l1_tok', r.token)
    localStorage.setItem('l1_user', JSON.stringify(r.user))
    user.value = r.user
    view.value = r.user.role === 'admin' ? 'admin' : 'home'
    if (view.value === 'admin') loadSample()
  } catch (e) { loginErr.value = e.message }
}
function logout() {
  localStorage.removeItem('l1_tok'); localStorage.removeItem('l1_user')
  user.value = null; view.value = 'home'
}
async function loadSample() {
  try { const s = await get('/reports/sample'); tpl.value = s.template; rdata.value = JSON.stringify(s.data, null, 2) } catch {}
}
async function generate() {
  genErr.value = ''; output.value = ''
  let data = {}
  try { data = JSON.parse(rdata.value) } catch (e) { genErr.value = 'invalid JSON: ' + e.message; return }
  try { const r = await post('/reports/generate', { template: tpl.value, data }); output.value = r.output }
  catch (e) { genErr.value = e.message }
}

onMounted(loadPosts)
</script>

<template>
  <header>
    <span class="brand" @click="view = 'home'">Latty</span>
    <span class="sub">notes from the team</span>
    <nav>
      <a @click="view = 'home'">Blog</a>
      <a v-if="user && user.role === 'admin'" @click="view = 'admin'; loadSample()">Reports</a>
      <a v-if="!user" @click="view = 'login'">Sign in</a>
      <a v-else @click="logout">Sign out ({{ user.username }})</a>
    </nav>
  </header>

  <main>
    <!-- HOME -->
    <section v-if="view === 'home'">
      <div class="search">
        <input v-model="query" placeholder="Search posts…" @keyup.enter="runSearch" />
        <button @click="runSearch">Search</button>
      </div>
      <div v-if="results" class="results card">
        <p v-if="results.error" class="err">{{ results.error }}</p>
        <template v-else>
          <p class="muted">{{ results.length }} result(s)</p>
          <ul><li v-for="r in results" :key="r.id"><b>{{ r.title }}</b> — <span class="muted">{{ r.author }}</span></li></ul>
        </template>
      </div>
      <article v-for="p in posts" :key="p.id" class="card post-list" @click="openPost(p.id)">
        <h2>{{ p.title }}</h2>
        <p class="muted">by {{ p.author }} · {{ p.created }}</p>
        <p>{{ p.snippet }}…</p>
      </article>
    </section>

    <!-- POST -->
    <section v-else-if="view === 'post' && current" class="card">
      <a class="back" @click="view = 'home'">← back</a>
      <h1>{{ current.title }}</h1>
      <p class="muted">by {{ current.author }} · {{ current.created }}</p>
      <p>{{ current.body }}</p>
    </section>

    <!-- LOGIN -->
    <section v-else-if="view === 'login'" class="card narrow">
      <h2>Sign in</h2>
      <input v-model="lu" placeholder="username" />
      <input v-model="lp" type="password" placeholder="password" @keyup.enter="doLogin" />
      <button @click="doLogin">Sign in</button>
      <p v-if="loginErr" class="err">{{ loginErr }}</p>
      <p class="muted">Staff accounts only.</p>
    </section>

    <!-- ADMIN REPORTS -->
    <section v-else-if="view === 'admin'" class="card">
      <h2>Invoice / report generator</h2>
      <p class="muted">Template supports <code>{{ ph }}</code> filled from the JSON data below.</p>
      <label>Template</label>
      <textarea v-model="tpl" rows="7"></textarea>
      <label>Data (JSON)</label>
      <textarea v-model="rdata" rows="6"></textarea>
      <button @click="generate">Generate</button>
      <p v-if="genErr" class="err">{{ genErr }}</p>
      <template v-if="output">
        <label>Output</label>
        <pre class="output">{{ output }}</pre>
      </template>
    </section>
  </main>
</template>
