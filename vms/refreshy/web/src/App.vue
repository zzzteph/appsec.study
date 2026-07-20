<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { get, post, patch, del, saveTokens, logout, isAuthed } from './api.js'

const route = ref(window.location.hash || '#/')
const onHash = () => { route.value = window.location.hash || '#/' }
onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))
const path = computed(() => route.value.replace(/^#/, '').split('?')[0])
const authed = ref(isAuthed())
const me = ref(null)
const msg = ref('')
function nav(h) { window.location.hash = h }
function flash(t) { msg.value = t; setTimeout(() => { if (msg.value === t) msg.value = '' }, 4000) }

const posts = ref([])
const search = ref('')
const np = reactive({ title: '', body: '' })
const commentDraft = reactive({})
const editing = reactive({})
const auth = reactive({ username: '', password: '' })

async function loadMe() { try { me.value = await get('/me', true) } catch (e) { me.value = null } }
async function loadPosts() {
  const q = search.value ? '?search=' + encodeURIComponent(search.value) : ''
  posts.value = await get('/posts' + q)
}
async function createPost() {
  try { await post('/posts', { title: np.title, body: np.body }); np.title = ''; np.body = ''; await loadPosts(); flash('Posted') }
  catch (e) { flash(e.message) }
}
async function ratePost(p) { try { await post('/posts/' + p.id + '/rate', { value: 1 }); await loadPosts() } catch (e) { flash(e.message) } }
async function addComment(p) {
  try { await post('/posts/' + p.id + '/comments', { body: commentDraft[p.id] || '' }); commentDraft[p.id] = ''; await reloadOne(p) }
  catch (e) { flash(e.message) }
}
async function reloadOne(p) { const full = await get('/posts/' + p.id); const i = posts.value.findIndex((x) => x.id === p.id); if (i >= 0) posts.value[i] = { ...posts.value[i], ...full } }
async function toggleComments(p) { if (p.comments) { p.comments = null } else { await reloadOne(p) } }
function startEdit(p) { editing[p.id] = { title: p.title, body: p.body } }
async function saveEdit(p) {
  try { await patch('/posts/' + p.id, { title: editing[p.id].title, body: editing[p.id].body }); delete editing[p.id]; await loadPosts(); flash('Saved') }
  catch (e) { flash(e.message) }
}
async function removePost(p) { try { await del('/posts/' + p.id); await loadPosts(); flash('Deleted') } catch (e) { flash(e.message) } }
async function doAuth(kind) {
  try { const d = await post('/' + kind, { username: auth.username, password: auth.password }, false); saveTokens(d); authed.value = true; me.value = d.user; flash('Welcome ' + d.user.username); nav('#/') }
  catch (e) { flash(e.message) }
}
function doLogout() { logout(); authed.value = false; me.value = null; nav('#/') }

watch(route, async () => {
  msg.value = ''
  if (path.value === '/' || path.value === '') { if (authed.value && !me.value) await loadMe(); await loadPosts() }
}, { immediate: true })
</script>

<template>
  <div class="app">
    <nav>
      <a class="brand" href="#/">Refreshy</a>
      <template v-if="authed">
        <span class="who">@{{ me && me.username }}</span>
        <a href="#" @click.prevent="doLogout">Logout</a>
      </template>
      <template v-else>
        <a href="#/login">Login</a>
        <a href="#/register">Register</a>
      </template>
    </nav>
    <p v-if="msg" class="flash">{{ msg }}</p>

    <div class="wrap">
      <!-- Feed -->
      <section v-if="path === '/' || path === ''">
        <div class="row">
          <input v-model="search" placeholder="Search posts…" @keyup.enter="loadPosts" />
          <button @click="loadPosts">Search</button>
        </div>

        <div v-if="authed" class="card new">
          <input v-model="np.title" placeholder="Post title" />
          <textarea v-model="np.body" placeholder="What's happening? (rich text allowed)"></textarea>
          <button @click="createPost">Post</button>
        </div>
        <p v-else class="muted">The demo account is <b>demo / demo</b> — log in to post, comment and rate.</p>

        <div v-for="p in posts" :key="p.id" class="card">
          <template v-if="editing[p.id]">
            <input v-model="editing[p.id].title" />
            <textarea v-model="editing[p.id].body"></textarea>
            <button @click="saveEdit(p)">Save</button>
            <button @click="delete editing[p.id]">Cancel</button>
          </template>
          <template v-else>
            <h3>{{ p.title }}</h3>
            <p class="byline">by <b>@{{ p.author }}</b> · ▲ {{ p.rating }}</p>
            <div class="body" v-html="p.body"></div>
            <div class="row">
              <button @click="ratePost(p)" :disabled="!authed">▲ Like</button>
              <button @click="toggleComments(p)">Comments</button>
              <template v-if="me && p.author_id === me.id">
                <button @click="startEdit(p)">Edit</button>
                <button @click="removePost(p)">Delete</button>
              </template>
            </div>
            <div v-if="p.comments" class="comments">
              <div v-for="c in p.comments" :key="c.id" class="comment">
                <b>@{{ c.author }}</b>: <span v-html="c.body"></span>
              </div>
              <div v-if="authed" class="row">
                <input v-model="commentDraft[p.id]" placeholder="Add a comment (rich text)…" />
                <button @click="addComment(p)">Comment</button>
              </div>
            </div>
          </template>
        </div>
        <p v-if="!posts.length" class="muted">No posts.</p>
      </section>

      <!-- Login / Register -->
      <section v-else-if="path === '/login' || path === '/register'">
        <h1>{{ path === '/login' ? 'Login' : 'Register' }}</h1>
        <div class="card">
          <input v-model="auth.username" placeholder="username" />
          <input v-model="auth.password" type="password" placeholder="password" />
          <button @click="doAuth(path === '/login' ? 'login' : 'register')">{{ path === '/login' ? 'Login' : 'Register' }}</button>
          <p class="muted">Access tokens expire after 2 minutes; the app refreshes them automatically.</p>
        </div>
      </section>

      <section v-else><p class="muted">Not found.</p></section>
    </div>
  </div>
</template>
