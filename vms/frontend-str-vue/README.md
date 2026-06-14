### frontend-str-vue

One of three parallel **DevBlog** apps (with [frontend-str-react](../frontend-str-react/) and
[frontend-str-angular](../frontend-str-angular/)) built to teach **framework-specific** client-side
vulnerabilities. Same blog logic in every app; only the framework-idiomatic flaws differ. This one
is **Vue 3** (Vite, pure client-side SPA). It uses the **full Vue build** (runtime template
compiler) so the CSTI sink works — see `vite.config.js`.

```
docker build -t frontend-str-vue ./vms/frontend-str-vue
docker run --rm -p 8080:80 frontend-str-vue   # http://localhost:8080
```

Vue escapes `{{ text }}` by default, so each bug below is an explicit opt-out.

| `VULN[id]` | Where | Trigger |
|---|---|---|
| `vue-v-html` | Post body, stored comments, compose preview (`v-html`) | Post a comment `<img src=x onerror=alert(document.domain)>` — persists (localStorage), fires on view |
| `vue-js-uri` | Author website link `<a :href="url">` | `#/profile/ada?url=javascript:alert(document.domain)` then click (Vue does not sanitize bound URLs) |
| `vue-csti` | Compose → "Template preview" (runtime-compiled template) | `{{constructor.constructor('alert(1)')()}}` — Vue compiles it in a `with(_ctx)` scope → sandbox escape |
| `vue-iframe-embed` | Compose → Embed URL `<iframe :src="url">` | `javascript:alert(1)` or any attacker origin |
| `vue-dynamic-component` | Sidebar widget via `<component :is>` | `#/?widget=admin` mounts a component never linked in the UI (leaks a build secret) |

Each sink is annotated with its `VULN[id]` in `src/components.js` / `src/App.vue`.

Deliberately insecure by design — run only locally / on an isolated network.
