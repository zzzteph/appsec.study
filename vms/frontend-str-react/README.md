### frontend-str-react

One of three parallel **DevBlog** apps (with [frontend-str-vue](../frontend-str-vue/) and
[frontend-str-angular](../frontend-str-angular/)) built to teach **framework-specific** client-side
vulnerabilities. Same blog logic in every app; the only differences are how each framework lets you
shoot yourself in the foot. This one is **React 18** (Vite, pure client-side SPA — no backend, so
every bug lives in the framework layer).

```
docker build -t frontend-str-react ./vms/frontend-str-react
docker run --rm -p 8080:80 frontend-str-react   # http://localhost:8080
```

React escapes `{value}` in JSX by default, so each bug below is an explicit escape hatch.

| `VULN[id]` | Where | Trigger |
|---|---|---|
| `react-dsih` | Post body, stored comments, compose preview (`dangerouslySetInnerHTML`) | Post a comment `<img src=x onerror=alert(document.domain)>` — it persists (localStorage) and fires on every view |
| `react-js-uri` | Author website link `<a href={url}>` | `#/profile/ada?url=javascript:alert(document.domain)` then click the link (React renders `javascript:` URLs, only warns) |
| `react-iframe-embed` | Compose → Embed URL `<iframe src={url}>` | paste `javascript:alert(1)` or any attacker origin |
| `react-props-spread` | Compose → Card attributes (`<div {...userProps}>`) | `{"dangerouslySetInnerHTML":{"__html":"<img src=x onerror=alert(1)>"}}` |
| `react-dynamic-component` | Sidebar widget chosen by name | `#/?widget=admin` renders a component never linked in the UI (leaks a build secret) |

Each sink is annotated with its `VULN[id]` in `src/components.jsx`.

Deliberately insecure by design — run only locally / on an isolated network.
