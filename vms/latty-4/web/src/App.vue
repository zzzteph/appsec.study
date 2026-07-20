<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from './api.js'

const user = ref(JSON.parse(localStorage.getItem('l4_user') || 'null'))
const tab = ref('projects')

// login
const lu = ref('demo'); const lp = ref(''); const loginErr = ref('')
async function doLogin() {
  loginErr.value = ''
  try {
    const r = await post('/login', { username: lu.value, password: lp.value })
    localStorage.setItem('l4_tok', r.token); localStorage.setItem('l4_user', JSON.stringify(r.user))
    user.value = r.user; loadProjects()
  } catch (e) { loginErr.value = e.message }
}
function logout() {
  localStorage.removeItem('l4_tok'); localStorage.removeItem('l4_user'); user.value = null
}

// projects
const projects = ref([])
const lookupId = ref('2')
const detail = ref(null); const detailErr = ref('')
async function loadProjects() { try { projects.value = await get('/projects') } catch {} }
async function openProject(id) {
  detailErr.value = ''; detail.value = null
  try { detail.value = await get('/projects/' + id) }
  catch (e) { detailErr.value = e.message }
}

// report builder
const sampleTpl = 'Report for <%= tenant %>\nGenerated: <%= new Date().toISOString() %>\nRows: <%= rows %>'
const apiKey = ref('')
const tpl = ref(sampleTpl)
const rdata = ref('{\n  "tenant": "acme",\n  "rows": 128\n}')
const output = ref(''); const renderErr = ref('')
async function render() {
  renderErr.value = ''; output.value = ''
  let data = {}
  try { data = JSON.parse(rdata.value) } catch (e) { renderErr.value = 'data must be JSON: ' + e.message; return }
  try {
    const r = await post('/reports/render', { template: tpl.value, data }, { 'X-API-Key': apiKey.value })
    output.value = r.output
  } catch (e) { renderErr.value = e.message }
}

onMounted(() => { if (user.value) loadProjects() })
</script>

<template>
  <header>
    <span class="brand">Latty<span class="p">Projects</span></span>
    <nav v-if="user">
      <a :class="{ on: tab === 'projects' }" @click="tab = 'projects'">Projects</a>
      <a :class="{ on: tab === 'reports' }" @click="tab = 'reports'">Report builder</a>
      <span class="who">{{ user.username }} · <a @click="logout">sign out</a></span>
    </nav>
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

    <!-- PROJECTS -->
    <section v-else-if="tab === 'projects'">
      <div class="card">
        <h2>Your projects</h2>
        <ul class="plist">
          <li v-for="p in projects" :key="p.id" @click="openProject(p.id)">
            <b>#{{ p.id }} {{ p.name }}</b> <span class="muted">· {{ p.tenant }}</span>
          </li>
        </ul>
        <div class="row">
          <input v-model="lookupId" placeholder="project id" />
          <button @click="openProject(lookupId)">Open project</button>
        </div>
        <p v-if="detailErr" class="err">{{ detailErr }}</p>
      </div>

      <div v-if="detail" class="card">
        <h3>Project #{{ detail.id }} — {{ detail.name }}</h3>
        <p><b>Tenant:</b> {{ detail.tenant }}</p>
        <p><b>Owner:</b> {{ detail.owner }}</p>
        <p><b>API key:</b> <code class="key">{{ detail.apiKey }}</code></p>
        <p><b>Scopes:</b> {{ detail.scopes.join(', ') }}</p>
      </div>
    </section>

    <!-- REPORTS -->
    <section v-else class="card">
      <h2>Report builder</h2>
      <p class="muted">Render a report from an EJS template. Requires a project API key with the
        <code>reports</code> scope.</p>
      <label>X-API-Key</label>
      <input v-model="apiKey" placeholder="project API key" />
      <label>Template (EJS)</label>
      <textarea v-model="tpl" rows="5" spellcheck="false"></textarea>
      <label>Data (JSON)</label>
      <textarea v-model="rdata" rows="4" spellcheck="false"></textarea>
      <button @click="render">Render</button>
      <p v-if="renderErr" class="err">{{ renderErr }}</p>
      <template v-if="output">
        <label>Output</label>
        <pre class="out">{{ output }}</pre>
      </template>
    </section>
  </main>
</template>
