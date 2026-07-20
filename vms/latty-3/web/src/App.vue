<script setup>
import { ref } from 'vue'
import { get, post } from './api.js'

const tab = ref('import')  // import | admin

// --- contact import ---
const sampleXml = '<?xml version="1.0"?>\n<contact>\n  <name>Jane Doe</name>\n  <email>jane@acme.example</email>\n  <note>Key account</note>\n</contact>'
const xml = ref(sampleXml)
const imported = ref(null); const importErr = ref('')
async function doImport() {
  importErr.value = ''; imported.value = null
  try { imported.value = (await post('/import', { xml: xml.value })).imported }
  catch (e) { importErr.value = e.message }
}

// --- admin console ---
const user = ref(JSON.parse(localStorage.getItem('l3_user') || 'null'))
const au = ref(''); const ap = ref(''); const adminErr = ref('')
const bname = ref('nightly'); const backup = ref(null); const backupErr = ref('')
async function adminLogin() {
  adminErr.value = ''
  try {
    const r = await post('/admin/login', { username: au.value, password: ap.value })
    localStorage.setItem('l3_tok', r.token); localStorage.setItem('l3_user', JSON.stringify(r.user))
    user.value = r.user
  } catch (e) { adminErr.value = e.message }
}
function adminLogout() {
  localStorage.removeItem('l3_tok'); localStorage.removeItem('l3_user'); user.value = null; backup.value = null
}
async function runBackup() {
  backupErr.value = ''; backup.value = null
  try { backup.value = await post('/admin/backup', { name: bname.value }) }
  catch (e) { backupErr.value = e.message }
}
</script>

<template>
  <header>
    <span class="brand">Latty<span class="b">Backup</span></span>
    <nav>
      <a :class="{ on: tab === 'import' }" @click="tab = 'import'">Import</a>
      <a :class="{ on: tab === 'admin' }" @click="tab = 'admin'">Admin console</a>
    </nav>
  </header>

  <main>
    <!-- IMPORT -->
    <section v-if="tab === 'import'" class="card">
      <h2>Contact import</h2>
      <p class="muted">Paste a contact record in XML and we'll parse it into the CRM.</p>
      <textarea v-model="xml" rows="9" spellcheck="false"></textarea>
      <button @click="doImport">Import</button>
      <p v-if="importErr" class="err">{{ importErr }}</p>
      <div v-if="imported" class="result">
        <h3>Parsed</h3>
        <p><b>Name:</b> <span class="v">{{ imported.name }}</span></p>
        <p><b>Email:</b> {{ imported.email }}</p>
        <p><b>Note:</b> {{ imported.note }}</p>
      </div>
    </section>

    <!-- ADMIN -->
    <section v-else class="card">
      <template v-if="!user">
        <h2>Admin console</h2>
        <div class="narrow">
          <input v-model="au" placeholder="username" />
          <input v-model="ap" type="password" placeholder="password" @keyup.enter="adminLogin" />
          <button @click="adminLogin">Sign in</button>
          <p v-if="adminErr" class="err">{{ adminErr }}</p>
          <p class="muted">Operations staff only.</p>
        </div>
      </template>
      <template v-else>
        <div class="head">
          <h2>Backup console</h2>
          <span class="who">{{ user.username }} · <a @click="adminLogout">sign out</a></span>
        </div>
        <p class="muted">Create a compressed archive of the service configuration.</p>
        <label>Archive name</label>
        <div class="row"><input v-model="bname" /><span class="suffix">.tgz</span><button @click="runBackup">Run backup</button></div>
        <p v-if="backupErr" class="err">{{ backupErr }}</p>
        <div v-if="backup" class="result">
          <p class="ok">{{ backup.message }}</p>
          <pre v-if="backup.log" class="out">{{ backup.log }}</pre>
        </div>
      </template>
    </section>
  </main>
</template>
