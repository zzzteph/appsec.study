import React, { useEffect, useState } from 'react'
import { posts, authors, getComments, addComment } from './data.js'
import { PostBody, AuthorLink, Embed, SpreadCard, Widget } from './components.jsx'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

function queryOf(hash) {
  const i = hash.indexOf('?')
  return new URLSearchParams(i >= 0 ? hash.slice(i + 1) : '')
}

function Nav() {
  return (
    <nav>
      <span className="brand">DevBlog · react</span>
      <a href="#/">Home</a>
      <a href="#/compose">Compose</a>
      <a href="#/profile/ada">Profile</a>
    </nav>
  )
}

function Home({ query }) {
  const widget = query.get('widget') || 'hello'
  return (
    <div className="layout">
      <main>
        <h1>Latest posts</h1>
        {posts.map((p) => (
          <div key={p.id} className="teaser">
            <a href={`#/post/${p.id}`}>
              <h2>{p.title}</h2>
            </a>
            <p className="byline">by {authors[p.author].name}</p>
          </div>
        ))}
      </main>
      <aside>
        <h3>Widget</h3>
        <Widget name={widget} />
        <p className="hint">
          try <code>#/?widget=admin</code>
        </p>
      </aside>
    </div>
  )
}

function Post({ id }) {
  const post = posts.find((p) => p.id === Number(id))
  const [comments, setComments] = useState(() => getComments(id))
  const [draft, setDraft] = useState('')
  if (!post) return <p>Post not found.</p>
  const author = authors[post.author]
  const submit = (e) => {
    e.preventDefault()
    addComment(id, draft)
    setComments(getComments(id))
    setDraft('')
  }
  return (
    <article>
      <h1>{post.title}</h1>
      <p className="byline">
        by {author.name} — <AuthorLink author={author} />
      </p>
      <PostBody html={post.body} />
      <section className="comments">
        <h3>Comments</h3>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        {comments.map((c, i) => (
          <PostBody key={i} className="comment" html={c.body} />
        ))}
        <form onSubmit={submit}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment (HTML allowed)…"
          />
          <button type="submit">Post comment</button>
        </form>
      </section>
    </article>
  )
}

function Compose() {
  const [html, setHtml] = useState('<h2>Draft</h2><p>Type some HTML…</p>')
  const [embed, setEmbed] = useState('')
  const [spread, setSpread] = useState('{"title":"hover me"}')
  let spreadProps = {}
  try {
    spreadProps = JSON.parse(spread)
  } catch {
    spreadProps = {}
  }
  return (
    <div>
      <h1>Compose</h1>

      <label>Body (HTML)</label>
      <textarea value={html} onChange={(e) => setHtml(e.target.value)} />
      <h3>Live preview</h3>
      <PostBody html={html} />

      <label>Embed URL</label>
      <input value={embed} onChange={(e) => setEmbed(e.target.value)} placeholder="https://…" />
      <Embed url={embed} />

      <label>Card attributes (JSON, spread onto a &lt;div&gt;)</label>
      <input value={spread} onChange={(e) => setSpread(e.target.value)} />
      <SpreadCard props={spreadProps} />
      <p className="hint">
        spread try:{' '}
        <code>{'{"dangerouslySetInnerHTML":{"__html":"<img src=x onerror=alert(1)>"}}'}</code>
      </p>
    </div>
  )
}

function Profile({ id, query }) {
  const author = authors[id]
  if (!author) return <p>No such author.</p>
  // Overridable from the query string so the URL / bio sinks are reachable
  // without a backend: #/profile/ada?url=javascript:alert(1)
  const a = {
    ...author,
    website: query.get('url') || author.website,
    bio: query.get('bio') || author.bio,
  }
  return (
    <div>
      <h1>{a.name}</h1>
      <PostBody html={a.bio} />
      <p>
        <AuthorLink author={a} />
      </p>
      <p className="hint">
        try <code>#/profile/ada?url=javascript:alert(document.domain)</code>
      </p>
    </div>
  )
}

export default function App() {
  const hash = useHashRoute()
  const query = queryOf(hash)
  const path = hash.replace(/^#/, '').split('?')[0]

  let view
  if (path.startsWith('/post/')) view = <Post id={path.split('/')[2]} />
  else if (path.startsWith('/compose')) view = <Compose />
  else if (path.startsWith('/profile/')) view = <Profile id={path.split('/')[2]} query={query} />
  else view = <Home query={query} />

  return (
    <div className="app">
      <Nav />
      <div className="container">{view}</div>
    </div>
  )
}
