// Recon / disclosure surface + decoys — seeded artifacts a scanner will crawl. MOST are DECOYS that
// grant nothing (maze walls to waste scanner time); a FEW point at real active block pages. Crucially,
// nothing here leaks the real signing key or admin password — those only come from ACTIVE disclosure /
// lfi / xxe blocks — so a decoy can NEVER create a false RCE and the guarantee is untouched. Everything
// is seed-deterministic via makeRng('recon:'+seed), so the same machine always exposes the same recon.
const { makeRng } = require('./rng')

function mountRecon(app, mut) {
  const rng = makeRng('recon:' + mut.seed)
  const pick = (a) => a[Math.floor(rng() * a.length)]
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
  const pubSlugs = mut.views.filter(v => !v.admin).map(v => v.slug)
  const pathFor = (sl) => (mut.api === 'traditional' ? '/b/' : '/') + sl

  // robots.txt — decoy Disallow dirs + a few real public block paths (some recon does pay off)
  const decoyDirs = ['/admin', '/internal', '/debug', '/backup', '/config', '/private', '/staging', '/beta', '/old', '/tmp', '/uploads', '/.git', '/cgi-bin', '/vendor']
  const disallow = shuffle(decoyDirs).slice(0, 6 + Math.floor(rng() * 5)).concat(shuffle(pubSlugs).slice(0, 4).map(pathFor))
  app.get('/robots.txt', (q, s) => s.type('text/plain').send('User-agent: *\n' + disallow.map(d => 'Disallow: ' + d).join('\n') + '\nSitemap: /sitemap.xml\n'))

  // sitemap.xml — real public block pages
  app.get('/sitemap.xml', (q, s) => {
    const urls = shuffle(pubSlugs).slice(0, 30).map(pathFor)
    s.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => '  <url><loc>' + u + '</loc></url>').join('\n') + '\n</urlset>\n')
  })

  // decoy .git at ROOT — generic, NO secrets (real .git leaks live only on active disclosure blocks)
  app.get('/.git/config', (q, s) => s.type('text/plain').send('[core]\n\trepositoryformatversion = 0\n\tbare = false\n[remote "origin"]\n\turl = git@github.com:example/site.git\n[branch "main"]\n\tremote = origin\n\tmerge = refs/heads/main\n'))
  app.get('/.git/HEAD', (q, s) => s.type('text/plain').send('ref: refs/heads/main\n'))

  // decoy dotfiles / editor backups — benign placeholders, consistent responses
  app.get('/.env', (q, s) => s.type('text/plain').send('APP_ENV=production\nAPP_DEBUG=false\nLOG_LEVEL=info\n# secrets are injected at runtime, not stored here\n'))
  app.get(['/backup.zip', '/backup.tar.gz', '/db.sql', '/dump.sql', '/index.js.bak', '/config.php~'], (q, s) => s.status(404).type('text/plain').send('Not Found'))

  // decoy public API docs at root — advertises nothing exploitable
  const rootSpec = { openapi: '3.0.0', info: { title: 'maze public API', version: '1.0' }, paths: { '/health': { get: { summary: 'health' } }, '/status': { get: { summary: 'status' } } } }
  app.get(['/openapi.json', '/swagger.json'], (q, s) => s.json(rootSpec))
  app.get('/swagger', (q, s) => s.type('html').send('<!doctype html><title>API docs</title><h1>maze API</h1><p>See <a href="/openapi.json">/openapi.json</a>.</p>'))
  app.get(['/health', '/status', '/healthz'], (q, s) => s.json({ status: 'ok', version: '1.0' }))

  // a handful of juicy-looking decoy endpoints that grant NOTHING — consistent 404/403/benign shapes
  const decoyApis = shuffle(['/admin/login', '/actuator/env', '/server-status', '/phpinfo.php', '/.aws/credentials', '/wp-login.php', '/console', '/metrics', '/.svn/entries', '/web.config'])
  for (const p of decoyApis.slice(0, 5 + Math.floor(rng() * 3))) {
    const mode = pick(['404', '403', 'benign'])
    app.get(p, (q, s) => mode === '404' ? s.status(404).json({ error: 'not found' })
      : mode === '403' ? s.status(403).json({ error: 'forbidden' })
        : s.status(200).json({ ok: true, note: 'nothing to see here' }))
  }
}

module.exports = { mountRecon }
