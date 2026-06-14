### frontend-str-angular

One of three parallel **DevBlog** apps (with [frontend-str-react](../frontend-str-react/) and
[frontend-str-vue](../frontend-str-vue/)) built to teach **framework-specific** client-side
vulnerabilities. Same blog logic in every app; only the framework-idiomatic flaws differ. This one
is **Angular 17** (standalone, pure client-side SPA). The JIT compiler is shipped (`import
'@angular/compiler'` in `main.ts`) so the CSTI sink works.

```
docker build -t frontend-str-angular ./vms/frontend-str-angular
docker run --rm -p 8080:80 frontend-str-angular   # http://localhost:8080
```

Angular is **safe by default** — `[innerHTML]`, `[href]` and `[src]` are auto-sanitized. So the
lesson here is the opposite of React/Vue: every bug is a developer **disabling** that protection.

| `VULN[id]` | Where | Trigger |
|---|---|---|
| `ng-bypass-html` | Post body, comments, compose preview (`bypassSecurityTrustHtml` → `[innerHTML]`) | Post a comment `<img src=x onerror=alert(document.domain)>`. (Compare: the same input through plain `[innerHTML]` on the compose page is sanitized — the script is stripped.) |
| `ng-bypass-url` | Author website link (`bypassSecurityTrustUrl` → `[href]`) | `#/profile/ada?url=javascript:alert(document.domain)` then click |
| `ng-bypass-resourceurl` | Compose → Embed (`bypassSecurityTrustResourceUrl` → iframe `[src]`) | any attacker origin / `javascript:` |
| `ng-jit-csti` | Compose → "Template preview" (runtime JIT-compiled template) | `{{constructor.constructor('alert(1)')()}}` — no sandbox in Angular expressions → script exec |
| `ng-open-redirect` | Compose → Redirect, or `?next=` (`location.href = userInput`) | `#/compose?next=https://evil.example` (or `javascript:…`) then Continue |

Each sink is annotated with its `VULN[id]` in `src/app/app.component.ts` / `csti-preview.component.ts`.

Deliberately insecure by design — run only locally / on an isolated network.
