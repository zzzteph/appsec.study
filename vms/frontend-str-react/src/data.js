// Shared "DevBlog" seed data. The same authors/posts back the React, Vue and
// Angular builds so the only differences between them are framework-specific.
export const authors = {
  ada: {
    id: 'ada',
    name: 'Ada Lovelace',
    website: 'https://ada.example',
    bio: '<p>Writes about the <em>history of computing</em>.</p>',
  },
  linus: {
    id: 'linus',
    name: 'Linus T.',
    website: 'https://linus.example',
    bio: '<p>Ships <strong>fast</strong>, reviews faster.</p>',
  },
}

export const posts = [
  {
    id: 1,
    title: 'Welcome to DevBlog',
    author: 'ada',
    body: '<h2>Hello</h2><p>A tiny blog used to demonstrate <strong>framework-specific</strong> rendering behaviour.</p>',
  },
  {
    id: 2,
    title: 'Shipping fast with Vite',
    author: 'linus',
    body: '<p>Vite keeps the dev loop quick. <em>Give it a try.</em></p>',
  },
  {
    id: 3,
    title: 'Notes on output encoding',
    author: 'ada',
    body: '<p>How a framework escapes output decides your XSS surface.</p>',
  },
]

// Comments persist in localStorage so an injected payload "sticks" across
// reloads — i.e. a genuine stored sink rather than a one-shot reflection.
const CKEY = 'devblog.comments'

export function getComments(postId) {
  const all = JSON.parse(localStorage.getItem(CKEY) || '{}')
  return all[postId] || []
}

export function addComment(postId, body) {
  const all = JSON.parse(localStorage.getItem(CKEY) || '{}')
  all[postId] = all[postId] || []
  all[postId].push({ body, at: Date.now() })
  localStorage.setItem(CKEY, JSON.stringify(all))
}
