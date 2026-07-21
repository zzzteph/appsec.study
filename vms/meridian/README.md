# Meridian ID 🔐

A single-sign-on / OpenID Connect **identity provider** — with a login/consent
flow, an OAuth2 `authorize`/`token`/`userinfo` surface, an app directory, an
admin console, and two bundled relying-party apps (**Meridian Docs**, **Meridian
Shop**) that "Sign in with Meridian." It behaves like a real SSO product, with a
large surface of ordinary, correctly-built features.

> Deliberately insecure by design. For testing and training. Most of the flow is
> hardened on purpose — the interesting bugs hide in the OAuth details.

## Run

```
docker build -t meridian vms/meridian && docker run --rm -p 8080:80 meridian
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

The OAuth/OIDC attack surface end-to-end: `redirect_uri` handling, authorization
codes, `state`, scopes, token issuance and validation, id_token signing,
account/identity linking, plus classic IDOR/SQLi/XSS and a path to code
execution through the admin console. Read `/.well-known/openid-configuration`,
watch where codes and tokens flow, and don't trust the UI.

_Everything needed is inside the container — the callback "catcher" and every
oracle are bundled; no external services or out-of-band infrastructure._
