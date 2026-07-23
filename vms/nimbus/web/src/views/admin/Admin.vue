<script setup>
import { ref, onMounted, computed } from 'vue'
import { get, post, currentUser } from '../../api'
import { avatar } from '../../assets/art'
const me = currentUser()
const tab = ref('overview'); const denied = ref(false)
const ov = ref(null); const users = ref([]); const comments = ref([]); const cfg = ref(null)
const tpl = ref('Hi {{ name }}, {{ sharer }} shared "{{ file }}" with you.'); const out = ref(null); const terr = ref('')
async function loadOv() { try { ov.value = await get('/admin/overview') } catch { denied.value = true } }
onMounted(loadOv)
async function go(t) { tab.value = t; try { if (t === 'users') users.value = await get('/admin/users'); if (t === 'review') comments.value = await get('/admin/comments'); if (t === 'config') cfg.value = await get('/admin/config') } catch {} }
async function preview() { terr.value = ''; out.value = null; try { out.value = await post('/admin/notify/preview', { template: tpl.value }) } catch (e) { terr.value = e.message } }
const TABS = [['overview', 'Overview'], ['users', 'Users'], ['review', 'Comment Review'], ['notify', 'Notifications']]
</script>
<template>
  <div v-if="denied" class="card warnbox">Administrator access required.</div>
  <template v-else>
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">Admin</h1><span class="badge staff">{{ me.role }}</span></div>
    <div class="tabs" style="max-width:560px"><button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="go(t[0])">{{ t[1] }}</button><button :class="{ active: tab === 'config' }" @click="go('config')">Config</button></div>
    <div v-if="tab === 'overview' && ov" class="grid g3">
      <div class="card stat"><div class="n">{{ ov.users }}</div><div class="l">Users</div></div>
      <div class="card stat"><div class="n">{{ ov.files }}</div><div class="l">Files</div></div>
      <div class="card stat"><div class="n">{{ ov.shares }}</div><div class="l">Shares</div></div>
    </div>
    <div v-if="tab === 'users'" class="card"><table><thead><tr><th>ID</th><th>User</th><th>Email</th><th>Role</th><th>Quota</th></tr></thead>
      <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td><div class="row"><img class="avatar" :src="avatar(u.username, 26)" width="26" height="26" />{{ u.name }}</div></td><td class="muted">{{ u.email }}</td><td><span class="badge" :class="u.role==='admin'?'staff':'ok'">{{ u.role }}</span></td><td>{{ u.quota_gb }} GB</td></tr></tbody></table></div>
    <div v-if="tab === 'review'" class="card"><h3>Recent comments</h3>
      <div v-for="c in comments" :key="c.id" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>{{ c.author_name }}</b> <span class="muted" style="font-size:12px">on file #{{ c.file_id }}</span><div class="muted" style="font-size:13px" v-html="c.body"></div></div>
    </div>
    <div v-if="tab === 'notify'" class="card">
      <h3>Share notification template</h3>
      <p class="muted" style="font-size:13px">Variables: name, sharer, file. Preview renders it.</p>
      <textarea v-model="tpl" class="mono"></textarea>
      <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
      <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
      <div v-if="terr" class="err-inline" style="margin-top:10px">{{ terr }}</div>
    </div>
    <div v-if="tab === 'config' && cfg" class="card"><table><tbody><tr v-for="(v,k) in cfg" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table></div>
  </template>
</template>
