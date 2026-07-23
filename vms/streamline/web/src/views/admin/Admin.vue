<template>
  <div class="container grid">
    <div class="row"><h2 style="margin:0">Workspace Admin</h2><span class="spacer"></span><router-link to="/"><button class="ghost sm">← Back to chat</button></router-link></div>

    <div class="card">
      <h3 style="margin-top:0">Broadcast announcement</h3>
      <p class="muted">Compose a workspace-wide announcement. Templates support <code v-pre>{{ app }}</code> and simple expressions for personalization.</p>
      <textarea v-model="tpl" rows="3" placeholder="Announcement template…"></textarea>
      <div class="row" style="margin-top:10px"><button @click="announce">Preview & send</button><span class="muted" v-if="rendered">Rendered:</span></div>
      <div v-if="rendered" class="card" style="margin-top:10px;background:var(--panel2)"><div v-html="rendered"></div></div>
      <div v-if="err" class="err">{{ err }}</div>
    </div>

    <div class="card">
      <h3 style="margin-top:0">Members</h3>
      <table><thead><tr><th>ID</th><th>Username</th><th>Role</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td>{{ u.username }}</td><td><span class="pill">{{ u.role }}</span></td></tr></tbody>
      </table>
    </div>

    <div class="card">
      <h3 style="margin-top:0">Channel exports</h3>
      <p class="muted">Download archived channel transcripts.</p>
      <div class="row"><select v-model="file" style="max-width:280px"><option v-for="f in files" :key="f" :value="f">{{ f }}</option></select><button class="ghost" @click="download">Download</button></div>
      <pre v-if="dump" class="card" style="margin-top:10px;background:var(--panel2);white-space:pre-wrap;overflow:auto">{{ dump }}</pre>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../../api'
const tpl = ref('Welcome to {{ app }}! Thanks for joining.'); const rendered = ref(''); const err = ref('')
const users = ref([]); const files = ref([]); const file = ref(''); const dump = ref('')
async function announce(){ err.value=''; rendered.value=''; try { const r = await post('/admin/announce', { template: tpl.value }); rendered.value = r.rendered } catch(e){ err.value = e.message } }
async function download(){ dump.value=''; try { const r = await fetch('/api/export?file='+encodeURIComponent(file.value), { headers:{ Authorization:'Bearer '+localStorage.getItem('sl_tok') } }); dump.value = await r.text() } catch(e){ dump.value = String(e) } }
onMounted(async () => {
  try { users.value = await get('/admin/users') } catch {}
  try { const r = await get('/export'); files.value = r.available || [] } catch {}
})
</script>
