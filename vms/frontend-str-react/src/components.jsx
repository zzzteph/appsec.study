import React from 'react'

// VULN[react-dsih] — raw-HTML sink.
// React escapes {text} by default; dangerouslySetInnerHTML opts out. Post
// bodies, stored comments and the compose preview all flow through here, so any
// markup (e.g. <img src=x onerror=alert(document.domain)>) executes.
export function PostBody({ html, className = 'body' }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

// VULN[react-js-uri] — React does not sanitize URL attributes.
// A `javascript:` URL in an author's website field runs when the link is
// clicked (React only logs a dev warning, it does not block it).
export function AuthorLink({ author }) {
  return (
    <a className="author-link" href={author.website} rel="noreferrer">
      {author.name}&apos;s site ↗
    </a>
  )
}

// VULN[react-iframe-embed] — user-supplied embed URL flows straight into an
// iframe src. `javascript:`/`data:` URLs and arbitrary third-party origins load
// in-page (framing, drive-by, clickjacking shell).
export function Embed({ url }) {
  if (!url) return null
  return <iframe className="embed" title="embed" src={url} />
}

// VULN[react-props-spread] — a user-controlled object is spread onto a DOM
// element. The attacker can smuggle in dangerouslySetInnerHTML, onError, style,
// etc. — e.g. {"dangerouslySetInnerHTML":{"__html":"<img src=x onerror=alert(1)>"}}.
export function SpreadCard({ props }) {
  return <div className="card" {...props} />
}

// VULN[react-dynamic-component] — the sidebar widget is selected by name from
// untrusted input. An attacker can render components that are never linked in
// the UI (here, an "admin" widget that leaks a build secret).
function HelloWidget() {
  return <div className="widget">👋 Hello, reader!</div>
}
function StatsWidget() {
  return <div className="widget">1,024 readers online</div>
}
function AdminWidget() {
  return <div className="widget admin">ADMIN · build token = devblog-ci-7f3a-do-not-share</div>
}
export const widgets = { hello: HelloWidget, stats: StatsWidget, admin: AdminWidget }

export function Widget({ name }) {
  const Cmp = widgets[name] || widgets.hello
  return <Cmp />
}
