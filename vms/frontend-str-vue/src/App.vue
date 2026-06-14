<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue'
import { posts, authors, getComments, addComment } from './data.js'
import { PostBody, AuthorLink, Embed, widgets } from './components.js'

const hash = ref(window.location.hash || '#/')
const onHash = () => { hash.value = window.location.hash || '#/' }
onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))

const query = computed(() => {
  const i = hash.value.indexOf('?')
  return new URLSearchParams(i >= 0 ? hash.value.slice(i + 1) : '')
})
const path = computed(() => hash.value.replace(/^#/, '').split('?')[0])

// Home / widget
const widget = computed(() => widgets[query.value.get('widget')] || widgets.hello)

// Post view
const postId = computed(() => Number(path.value.split('/')[2]))
const post = computed(() => posts.find((p) => p.id === postId.value))
const postAuthor = computed(() => (post.value ? authors[post.value.author] : null))
const comments = ref([])
watchEffect(() => {
  if (path.value.startsWith('/post/')) comments.value = getComments(postId.value)
})
const draft = ref('')
function submitComment() {
  addComment(postId.value, draft.value)
  draft.value = ''
  comments.value = getComments(postId.value)
}

// Profile (sinks reachable via ?url / ?bio, no backend needed)
const profileAuthor = computed(() => {
  const a = authors[path.value.split('/')[2]]
  if (!a) return null
  return { ...a, website: query.value.get('url') || a.website, bio: query.value.get('bio') || a.bio }
})

// Compose
const composeHtml = ref('<h2>Draft</h2><p>Type some HTML…</p>')
const embedUrl = ref('')
// VULN[vue-csti] — the live preview compiles a user-controlled template at
// runtime. Vue's runtime-compiled render runs expressions in a with(_ctx)
// scope, so {{constructor.constructor('alert(1)')()}} escapes to script exec.
const tpl = ref('Hello {{ 1 + 1 }}')
const previewComp = computed(() => ({ template: `<div class="body">${tpl.value}</div>` }))
// Kept as data (not inline in the template) so the SFC parser doesn't try to
// evaluate the literal {{ }} as an interpolation.
const cstiHint = "{{constructor.constructor('alert(1)')()}}"
</script>

<template>
  <div class="app">
    <nav>
      <span class="brand">DevBlog · vue</span>
      <a href="#/">Home</a>
      <a href="#/compose">Compose</a>
      <a href="#/profile/ada">Profile</a>
    </nav>

    <div class="container">
      <!-- Home -->
      <div v-if="path === '/' || path === ''" class="layout">
        <main>
          <h1>Latest posts</h1>
          <div v-for="p in posts" :key="p.id" class="teaser">
            <a :href="`#/post/${p.id}`"><h2>{{ p.title }}</h2></a>
            <p class="byline">by {{ authors[p.author].name }}</p>
          </div>
        </main>
        <aside>
          <h3>Widget</h3>
          <component :is="widget" />
          <p class="hint">try <code>#/?widget=admin</code></p>
        </aside>
      </div>

      <!-- Post -->
      <article v-else-if="path.startsWith('/post/')">
        <template v-if="post">
          <h1>{{ post.title }}</h1>
          <p class="byline">by {{ postAuthor.name }} — <AuthorLink :author="postAuthor" /></p>
          <PostBody :html="post.body" />
          <section class="comments">
            <h3>Comments</h3>
            <p v-if="comments.length === 0" class="muted">No comments yet.</p>
            <PostBody v-for="(c, i) in comments" :key="i" cls="comment" :html="c.body" />
            <form @submit.prevent="submitComment">
              <textarea v-model="draft" placeholder="Add a comment (HTML allowed)…"></textarea>
              <button type="submit">Post comment</button>
            </form>
          </section>
        </template>
        <p v-else>Post not found.</p>
      </article>

      <!-- Compose -->
      <div v-else-if="path.startsWith('/compose')">
        <h1>Compose</h1>

        <label>Body (HTML)</label>
        <textarea v-model="composeHtml"></textarea>
        <h3>Live preview (v-html)</h3>
        <PostBody :html="composeHtml" />

        <label>Template preview (compiled)</label>
        <input v-model="tpl" />
        <component :is="previewComp" />
        <p class="hint">CSTI try: <code>{{ cstiHint }}</code></p>

        <label>Embed URL</label>
        <input v-model="embedUrl" placeholder="https://…" />
        <Embed :url="embedUrl" />
      </div>

      <!-- Profile -->
      <div v-else-if="path.startsWith('/profile/')">
        <template v-if="profileAuthor">
          <h1>{{ profileAuthor.name }}</h1>
          <PostBody :html="profileAuthor.bio" />
          <p><AuthorLink :author="profileAuthor" /></p>
          <p class="hint">try <code>#/profile/ada?url=javascript:alert(document.domain)</code></p>
        </template>
        <p v-else>No such author.</p>
      </div>
    </div>
  </div>
</template>
