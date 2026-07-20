// Tiny faker-lite so a freshly-generated mutation is populated with plausible, plentiful content
// (names, product titles, posts, companies, bios). No deps; varies each restart.
const R = () => Math.random()
const pick = (a) => a[Math.floor(R() * a.length)]
const int = (a, b) => a + Math.floor(R() * (b - a + 1))
const chance = (p) => R() < p
const sample = (a, n) => { const c = [...a]; const o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(R() * c.length), 1)[0]); return o }

const FIRST = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Robin', 'Skyler', 'Cameron', 'Devon', 'Harper', 'Elliot', 'Reese', 'Rowan', 'Sage', 'Nora', 'Leo', 'Mia', 'Owen', 'Ivy', 'Theo', 'Ada', 'Hugo', 'Lena', 'Max']
const LAST = ['Carter', 'Nguyen', 'Patel', 'Kim', 'Rossi', 'Silva', 'Haddad', 'Owens', 'Brooks', 'Meyer', 'Novak', 'Dubois', 'Costa', 'Ivanov', 'Khan', 'Reyes', 'Walsh', 'Frost', 'Bauer', 'Lindqvist', 'Marsh', 'Okafor', 'Tanaka', 'Blum', 'Vega', 'Cruz', 'Doyle', 'Fisher', 'Grant', 'Hale']
const ADJ = ['Aero', 'Nimbus', 'Vertex', 'Lumen', 'Terra', 'Cobalt', 'Ember', 'Pixel', 'Nova', 'Quartz', 'Drift', 'Slate', 'Halo', 'Fable', 'Orbit', 'Prism', 'Onyx', 'Willow', 'Zephyr', 'Copper']
const NOUN = ['Bottle', 'Backpack', 'Lamp', 'Headphones', 'Keyboard', 'Mug', 'Sneakers', 'Watch', 'Chair', 'Notebook', 'Speaker', 'Jacket', 'Wallet', 'Camera', 'Planter', 'Kettle', 'Desk Mat', 'Charger', 'Tote', 'Sunglasses']
const CATS = ['Electronics', 'Home', 'Apparel', 'Outdoors', 'Office', 'Accessories']
const COMPANY = ['Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli', 'Stark Supply', 'Wayne Traders', 'Acme Co', 'Cyberdyne', 'Wonka Goods', 'Tyrell', 'Vandelay', 'Pied Piper', 'Massive Dynamic']
const WORDS = ['launch', 'roadmap', 'coffee', 'weekend', 'ship', 'design', 'sprint', 'sunset', 'travel', 'garden', 'music', 'update', 'release', 'beta', 'commute', 'harbor', 'sketch', 'prototype', 'review', 'demo', 'meetup', 'thread', 'idea', 'notes']
const POSTS = [
  'Just shipped the new dashboard — feedback welcome!',
  'Anyone else loving this weather for a weekend hike?',
  'Hot take: tabs beat spaces, fight me in the comments.',
  'Finally fixed that caching bug that haunted me for a week.',
  'Coffee count today: 4. Productivity: debatable.',
  'New blog post up on scaling our search pipeline.',
  'Looking for recommendations on a good mechanical keyboard.',
  'Sunset over the harbor never gets old.',
  'We just crossed 10k users — thank you all!',
  'Prototyping a little side project this weekend.',
  'Reminder: back up your work. Ask me how I know.',
  'The partner program is now open for applications.',
]
const BIOS = ['Builder of small things.', 'Coffee-driven developer.', 'Designer, tinkerer, hiker.', 'Talks about product & pixels.', 'Backend by day, synths by night.', 'Making the web a bit friendlier.', 'Ops, but make it calm.', 'Perpetual side-project starter.']

function fullName() { return pick(FIRST) + ' ' + pick(LAST) }
function usernameFrom(name, i) { return name.toLowerCase().replace(/[^a-z]+/g, '.') + (i != null ? i : int(1, 99)) }
function productName() { return pick(ADJ) + ' ' + pick(NOUN) }
function sentence() { return sample(WORDS, int(6, 12)).join(' ') + '.' }
function paragraph() { return [sentence(), sentence(), sentence()].join(' ') }

module.exports = { R, pick, int, chance, sample, fullName, usernameFrom, productName, sentence, paragraph, CATS, COMPANY, POSTS, BIOS, FIRST, LAST }
