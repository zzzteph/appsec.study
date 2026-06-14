import { Component, computed, effect, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser'
import { authors as AUTHORS, posts as POSTS, getComments, addComment } from './data'
import { CstiPreviewComponent } from './csti-preview.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CstiPreviewComponent],
  template: `
    <nav>
      <span class="brand">DevBlog · angular</span>
      <a href="#/">Home</a>
      <a href="#/compose">Compose</a>
      <a href="#/profile/ada">Profile</a>
    </nav>

    <div class="container">
      <!-- Home -->
      <div class="layout" *ngIf="isHome()">
        <main>
          <h1>Latest posts</h1>
          <div class="teaser" *ngFor="let p of posts">
            <a [href]="'#/post/' + p.id"><h2>{{ p.title }}</h2></a>
            <p class="byline">by {{ authors[p.author].name }}</p>
          </div>
        </main>
        <aside>
          <h3>Widget</h3>
          <div [class]="widget() === 'admin' ? 'widget admin' : 'widget'">{{ widgetText() }}</div>
          <p class="hint">try <code>#/?widget=admin</code></p>
        </aside>
      </div>

      <!-- Post -->
      <article *ngIf="isPost()">
        <ng-container *ngIf="post() as po">
          <h1>{{ po.title }}</h1>
          <p class="byline">
            by {{ postAuthor()?.name }} —
            <a class="author-link" [href]="trustUrl(postAuthor()!.website)">{{ postAuthor()!.name }}'s site ↗</a>
          </p>
          <div class="body" [innerHTML]="trustHtml(po.body)"></div>
          <section class="comments">
            <h3>Comments</h3>
            <p class="muted" *ngIf="comments().length === 0">No comments yet.</p>
            <div class="comment" *ngFor="let c of comments()" [innerHTML]="trustHtml(c.body)"></div>
            <textarea
              [value]="draft()"
              (input)="draft.set($event.target.value)"
              placeholder="Add a comment (HTML allowed)…"
            ></textarea>
            <button (click)="submitComment()">Post comment</button>
          </section>
        </ng-container>
        <p *ngIf="!post()">Post not found.</p>
      </article>

      <!-- Compose -->
      <div *ngIf="isCompose()">
        <h1>Compose</h1>

        <label>Body (HTML) — trusted via bypassSecurityTrustHtml</label>
        <textarea [value]="composeHtml()" (input)="composeHtml.set($event.target.value)"></textarea>
        <h3>Live preview (bypassed → raw)</h3>
        <div class="body" [innerHTML]="trustHtml(composeHtml())"></div>

        <h3>Same input via plain [innerHTML] (Angular sanitizes → script stripped)</h3>
        <div class="body" [innerHTML]="composeHtml()"></div>

        <label>Template preview (compiled at runtime — CSTI)</label>
        <input [value]="tpl()" (input)="tpl.set($event.target.value)" />
        <csti-preview [tpl]="tpl()"></csti-preview>
        <p class="hint">CSTI try: <code>{{ cstiHint }}</code></p>

        <label>Embed URL — trusted via bypassSecurityTrustResourceUrl</label>
        <input [value]="embedUrl()" (input)="embedUrl.set($event.target.value)" placeholder="https://…" />
        <iframe class="embed" *ngIf="embedUrl()" [src]="trustResource(embedUrl())" title="embed"></iframe>

        <label>Redirect (?next=) — open redirect</label>
        <input [value]="redirectUrl()" (input)="redirectUrl.set($event.target.value)" placeholder="https://… or javascript:…" />
        <button (click)="redirect(redirectUrl())">Continue</button>
      </div>

      <!-- Profile -->
      <div *ngIf="isProfile()">
        <ng-container *ngIf="profileAuthor() as a">
          <h1>{{ a.name }}</h1>
          <div class="body" [innerHTML]="trustHtml(a.bio)"></div>
          <p><a class="author-link" [href]="trustUrl(a.website)">{{ a.name }}'s site ↗</a></p>
          <p class="hint">try <code>#/profile/ada?url=javascript:alert(document.domain)</code></p>
        </ng-container>
        <p *ngIf="!profileAuthor()">No such author.</p>
      </div>
    </div>
  `,
})
export class AppComponent {
  private san = inject(DomSanitizer)

  authors = AUTHORS
  posts = POSTS
  cstiHint = "{{constructor.constructor('alert(1)')()}}"

  hash = signal(location.hash || '#/')
  comments = signal<{ body: string; at: number }[]>([])
  draft = signal('')
  composeHtml = signal('<h2>Draft</h2><p>Type some HTML…</p>')
  embedUrl = signal('')
  redirectUrl = signal('')
  tpl = signal('Hello {{ 1 + 1 }}')

  constructor() {
    addEventListener('hashchange', () => this.hash.set(location.hash || '#/'))
    // Refresh stored comments whenever we view a post.
    effect(() => {
      if (this.path().startsWith('/post/')) this.comments.set(getComments(this.postId()))
    })
    // Prefill the redirect box from ?next= so the open-redirect sink is reachable.
    effect(() => {
      const n = this.query().get('next')
      if (n) this.redirectUrl.set(n)
    })
  }

  query = computed(() => {
    const h = this.hash()
    const i = h.indexOf('?')
    return new URLSearchParams(i >= 0 ? h.slice(i + 1) : '')
  })
  path = computed(() => this.hash().replace(/^#/, '').split('?')[0])

  isHome = computed(() => this.path() === '/' || this.path() === '')
  isPost = computed(() => this.path().startsWith('/post/'))
  isCompose = computed(() => this.path().startsWith('/compose'))
  isProfile = computed(() => this.path().startsWith('/profile/'))

  widget = computed(() => this.query().get('widget') || 'hello')
  widgetText = computed(() => {
    const m: Record<string, string> = {
      hello: '👋 Hello, reader!',
      stats: '1,024 readers online',
      admin: 'ADMIN · build token = devblog-ci-7f3a-do-not-share',
    }
    return m[this.widget()] || m['hello']
  })

  postId = computed(() => Number(this.path().split('/')[2]))
  post = computed(() => POSTS.find((p) => p.id === this.postId()))
  postAuthor = computed(() => {
    const p = this.post()
    return p ? AUTHORS[p.author] : null
  })

  profileAuthor = computed(() => {
    const a = AUTHORS[this.path().split('/')[2]]
    if (!a) return null
    return {
      ...a,
      website: this.query().get('url') || a.website,
      bio: this.query().get('bio') || a.bio,
    }
  })

  submitComment() {
    addComment(this.postId(), this.draft())
    this.draft.set('')
    this.comments.set(getComments(this.postId()))
  }

  // VULN[ng-bypass-html] — [innerHTML] is auto-sanitized by Angular; calling
  // bypassSecurityTrustHtml disables that, so the markup renders raw.
  trustHtml = (h: string): SafeHtml => this.san.bypassSecurityTrustHtml(h)

  // VULN[ng-bypass-url] — [href] is auto-sanitized (javascript: stripped);
  // bypassSecurityTrustUrl re-enables dangerous schemes.
  trustUrl = (u: string): SafeUrl => this.san.bypassSecurityTrustUrl(u)

  // VULN[ng-bypass-resourceurl] — resource URLs (iframe/script src) are
  // normally blocked unless trusted; this trusts arbitrary origins.
  trustResource = (u: string): SafeResourceUrl => this.san.bypassSecurityTrustResourceUrl(u)

  // VULN[ng-open-redirect] — navigates to a fully user-controlled location.
  redirect(u: string) {
    if (u) location.href = u
  }
}
