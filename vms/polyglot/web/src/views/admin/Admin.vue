<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../../api'
import { avatar } from '../../assets/art'
const tab = ref('overview'); const denied = ref(false)
const ov = ref(null); const users = ref([]); const review = ref(null); const cfg = ref(null)
const tpl = ref('Hi {{ name }}, {{ count }} strings need translation in {{ project }}.'); const out = ref(null); const terr = ref('')
async function loadOv() { try { ov.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOv)
async function go(t) { tab.value = t; try { if (t === 'users') users.value = await get('/admin/users'); if (t === 'review') review.value = await get('/admin/review'); if (t === 'config') cfg.value = await get('/admin/config') } catch {} }
async function preview() { terr.value = ''; out.value = null; try { out.value = await post('/admin/email/preview', { template: tpl.value }) } catch (e) { terr.value = e.message } }
const TABS = [['overview', 'Overview'], ['users', 'Users'], ['review', 'Review'], ['email', 'Email Template']]
</script>
<template>
  <div v-if="denied" class="card" style="border-color:var(--warn)">Administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge brand">admin</span></div>
    <div class="tabs" style="max-width:560px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button><button :class="{ active: tab === 'config' }" @click="go('config')">Config</button></div>
    <div v-if="tab === 'overview' && ov" class="grid g3">
      <div class="card stat"><div class="n">{{ ov.users }}</div><div class="l">Users</div></div>
      <div class="card stat"><div class="n">{{ ov.projects }}</div><div class="l">Projects</div></div>
      <div class="card stat"><div class="n">{{ ov.strings }}</div><div class="l">Strings</div></div>
    </div>
    <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>User</th><th>Email</th><th>Role</th></tr></thead>
      <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td><div class="row"><img class="avatar" :src="avatar(u.username, 26)" width="26" height="26" />{{ u.name }}</div></td><td class="muted">{{ u.email }}</td><td><span class="badge brand">{{ u.role }}</span></td></tr></tbody></table></div>
    <div v-if="tab === 'review' && review" class="grid g2" style="align-items:start">
      <div class="card"><h3>Recent translations</h3>
        <div v-for="t in review.translations" :key="t.id" class="comment"><span class="badge brand">{{ t.lang }}</span> <span v-html="t.value"></span></div>
      </div>
      <div class="card"><h3>Suggestions</h3>
        <div v-for="s in review.suggestions" :key="s.id" class="comment"><b>{{ s.author }}</b><div class="muted" style="font-size:13px" v-html="s.body"></div></div>
      </div>
    </div>
    <div v-if="tab === 'email'" class="card">
      <h3>Notification email template</h3>
      <p class="muted" style="font-size:13px">Variables: name, count, project. Preview renders it.</p>
      <textarea v-model="tpl" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
      <div v-if="terr" class="err-inline" style="margin-top:10px">{{ terr }}</div>
    </div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
