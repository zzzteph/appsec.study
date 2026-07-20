// faker-lite content engine — fills every block/UI with a plentiful, plausible pile of data.
// Deterministic when MAZE_SEED is set (same seed → same content, matching the engine), otherwise
// random per boot. No deps.
const { makeRng } = require('./rng')
const R = process.env.MAZE_SEED ? makeRng('content:' + process.env.MAZE_SEED) : Math.random
const pick = (a) => a[Math.floor(R() * a.length)]
const int = (a, b) => a + Math.floor(R() * (b - a + 1))
const chance = (p) => R() < p
const sample = (a, n) => { const c = [...a]; const o = []; while (o.length < n && c.length) o.push(c.splice(Math.floor(R() * c.length), 1)[0]); return o }
const times = (n, fn) => Array.from({ length: n }, (_, i) => fn(i))

const FIRST = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Riley', 'Casey', 'Jamie', 'Avery', 'Quinn', 'Drew', 'Robin', 'Skyler', 'Cameron', 'Devon', 'Harper', 'Elliot', 'Reese', 'Rowan', 'Sage', 'Nora', 'Leo', 'Mia', 'Owen', 'Ivy', 'Theo', 'Ada', 'Hugo', 'Lena', 'Max', 'Iris', 'Felix', 'Ruby', 'Milo', 'Cora', 'Jonas', 'Nina', 'Ezra', 'Vera', 'Kai', 'Luca', 'Freya', 'Otto', 'Elsa', 'Arlo', 'Maya', 'Rex', 'Juno', 'Silas', 'Wren']
const LAST = ['Carter', 'Nguyen', 'Patel', 'Kim', 'Rossi', 'Silva', 'Haddad', 'Owens', 'Brooks', 'Meyer', 'Novak', 'Dubois', 'Costa', 'Ivanov', 'Khan', 'Reyes', 'Walsh', 'Frost', 'Bauer', 'Lindqvist', 'Marsh', 'Okafor', 'Tanaka', 'Blum', 'Vega', 'Cruz', 'Doyle', 'Fisher', 'Grant', 'Hale', 'Mercer', 'Bianchi', 'Sharma', 'Ford', 'Larsen', 'Adeyemi', 'Muller', 'Park', 'Romano', 'Hansen', 'Abbas', 'Yamamoto', 'Kowalski', 'Nakamura', 'Osei', 'Ricci', 'Sato', 'Vidal', 'Weiss', 'Zhang']
const ADJ = ['Aero', 'Nimbus', 'Vertex', 'Lumen', 'Terra', 'Cobalt', 'Ember', 'Pixel', 'Nova', 'Quartz', 'Drift', 'Slate', 'Halo', 'Fable', 'Orbit', 'Prism', 'Onyx', 'Willow', 'Zephyr', 'Copper', 'Solace', 'Atlas', 'Verve', 'Cedar', 'Flux', 'Ridge', 'Vela', 'Lyra', 'Basalt', 'Indigo']
const NOUN = ['Bottle', 'Backpack', 'Lamp', 'Headphones', 'Keyboard', 'Mug', 'Sneakers', 'Watch', 'Chair', 'Notebook', 'Speaker', 'Jacket', 'Wallet', 'Camera', 'Planter', 'Kettle', 'Desk Mat', 'Charger', 'Tote', 'Sunglasses', 'Stool', 'Blender', 'Tripod', 'Cushion', 'Umbrella', 'Thermos', 'Sandal', 'Beanie', 'Satchel', 'Monitor']
const CATS = ['Electronics', 'Home', 'Apparel', 'Outdoors', 'Office', 'Accessories', 'Kitchen', 'Fitness', 'Garden', 'Travel']
const COMPANY = ['Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli', 'Stark Supply', 'Wayne Traders', 'Acme Co', 'Cyberdyne', 'Wonka Goods', 'Tyrell', 'Vandelay', 'Pied Piper', 'Massive Dynamic', 'Northwind', 'Contoso', 'Fabrikam', 'Aperture', 'Blue Sun', 'Oscorp']
const CITY = ['Riverton', 'Fairmont', 'Ashford', 'Belport', 'Kingsley', 'Marlowe', 'Elmwood', 'Southbank', 'Highgate', 'Westbrook', 'Greenhill', 'Lakeside', 'Bridgeport', 'Oakvale', 'Sunderland']
const WORDS = ['launch', 'roadmap', 'coffee', 'weekend', 'ship', 'design', 'sprint', 'sunset', 'travel', 'garden', 'music', 'update', 'release', 'beta', 'commute', 'harbor', 'sketch', 'prototype', 'review', 'demo', 'meetup', 'thread', 'idea', 'notes', 'backlog', 'insight', 'metric', 'signal', 'canvas', 'pattern']
const TITLE_A = ['A Guide to', 'Rethinking', 'Behind the Scenes of', 'The State of', 'How We Built', 'Notes on', 'Lessons from', '5 Ways to Improve', 'The Case for', 'Getting Started with', 'Deep Dive:', 'The Future of']
const TITLE_B = ['Modern Layouts', 'Our Search Pipeline', 'Design Systems', 'Edge Caching', 'Team Rituals', 'Onboarding', 'Incident Response', 'Data Modeling', 'Accessibility', 'Release Trains', 'Observability', 'Cost Control']
const POSTS = [
  'Just shipped the new dashboard — feedback welcome!', 'Anyone else loving this weather for a weekend hike?',
  'Hot take: tabs beat spaces, fight me in the comments.', 'Finally fixed that caching bug that haunted me for a week.',
  'Coffee count today: 4. Productivity: debatable.', 'New blog post up on scaling our search pipeline.',
  'Looking for recommendations on a good mechanical keyboard.', 'Sunset over the harbor never gets old.',
  'We just crossed 10k users — thank you all!', 'Prototyping a little side project this weekend.',
  'Reminder: back up your work. Ask me how I know.', 'The partner program is now open for applications.',
  'Migrated the whole test suite to run in half the time.', 'Small UI polish pass landed — feels so much snappier.',
  'Office plants update: still alive, somehow.', 'Shipped dark mode. You are welcome, night owls.',
]
const COMMENTS = ['Nice one!', 'Thanks for sharing.', 'This is really helpful, saved me hours.', 'Any plans to open-source it?', 'Great write-up 👏', 'I ran into the same issue last month.', 'Bookmarking this for later.', 'Could you add an example?', 'Works like a charm, thanks!', 'Solid take, mostly agree.', 'Have you benchmarked this?', 'Following for updates.', 'Exactly what I needed today.', 'The diagrams really help.']
const REVIEWS = ['Exceeded expectations, would buy again.', 'Good value for the price.', 'Arrived quickly, well packaged.', 'Does the job, nothing fancy.', 'Not quite what I expected but decent.', 'Fantastic quality and finish.', 'A bit pricey but worth it.', 'Would recommend to a friend.', 'Sturdy and reliable so far.', 'Five stars, no complaints.']
const BIOS = ['Builder of small things.', 'Coffee-driven developer.', 'Designer, tinkerer, hiker.', 'Talks about product & pixels.', 'Backend by day, synths by night.', 'Making the web a bit friendlier.', 'Ops, but make it calm.', 'Perpetual side-project starter.', 'Turning coffee into commits.', 'Fan of clean diffs and clean desks.', 'Runs on to-do lists.', 'Prefers boring technology.']
const FILES = ['welcome.txt', 'readme.md', 'onboarding.md', 'q3-report.pdf', 'invoice-template.xlsx', 'brand-guide.pdf', 'changelog.md', 'roadmap.md', 'meeting-notes.txt', 'privacy-policy.md', 'terms.md', 'style-guide.pdf', 'api-notes.md', 'backup.tar.gz', 'export.csv']
const JOBS = ['nightly-backup', 'reindex-search', 'send-digest', 'purge-temp', 'rotate-logs', 'sync-partners', 'warm-cache', 'generate-invoices', 'cleanup-sessions', 'refresh-metrics']
const ROLES = ['user', 'user', 'user', 'partner', 'editor', 'viewer']

function fullName() { return pick(FIRST) + ' ' + pick(LAST) }
function usernameFrom(name, i) { return name.toLowerCase().replace(/[^a-z]+/g, '.') + (i != null ? i : int(1, 99)) }
function productName() { return pick(ADJ) + ' ' + pick(NOUN) }
function sentence() { return sample(WORDS, int(6, 12)).join(' ') + '.' }
function paragraph() { return [sentence(), sentence(), sentence()].join(' ') }
function articleTitle() { return pick(TITLE_A) + ' ' + pick(TITLE_B) }
function comment() { return pick(COMMENTS) }
function review() { return pick(REVIEWS) }
function fileName() { return pick(FILES) }
function jobName() { return pick(JOBS) }
function daysAgoISO(maxDays) { return new Date(Date.now() - int(0, maxDays || 30) * 86400000).toISOString().slice(0, 10) }

module.exports = { R, pick, int, chance, sample, times, fullName, usernameFrom, productName, sentence, paragraph, articleTitle, comment, review, fileName, jobName, daysAgoISO, CATS, COMPANY, CITY, POSTS, COMMENTS, REVIEWS, BIOS, FILES, JOBS, ROLES, FIRST, LAST, TITLE_A, TITLE_B }
