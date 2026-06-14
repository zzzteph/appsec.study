// Shared "DevBlog" seed data — identical content to the React and Vue builds
// so the apps differ only in framework-specific behaviour.
export interface Author {
  id: string
  name: string
  website: string
  bio: string
}

export interface Post {
  id: number
  title: string
  author: string
  body: string
}

export const authors: Record<string, Author> = {
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

export const posts: Post[] = [
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
// reloads — a genuine stored sink rather than a one-shot reflection.
const CKEY = 'devblog.comments'

export function getComments(postId: number): { body: string; at: number }[] {
  const all = JSON.parse(localStorage.getItem(CKEY) || '{}')
  return all[postId] || []
}

export function addComment(postId: number, body: string): void {
  const all = JSON.parse(localStorage.getItem(CKEY) || '{}')
  all[postId] = all[postId] || []
  all[postId].push({ body, at: Date.now() })
  localStorage.setItem(CKEY, JSON.stringify(all))
}
