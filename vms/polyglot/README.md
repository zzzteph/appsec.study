# Polyglot 🌐

A collaborative localization / translation platform — organize projects, browse
source strings, submit and preview translations, suggest improvements, export
locale files, with an admin console for review. It looks like an ordinary
translation-management product, with a large surface of ordinary, correctly-built
features.

> Deliberately insecure by design. For testing and training. The interesting bugs
> are in how translations are previewed and how project access is authorized.

## Run

```
docker build -t polyglot vms/polyglot && docker run --rm -p 8080:80 polyglot
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

Server-side template injection through translated strings, project/string
authorization, locale-file traversal, plus classic injection and a
privilege-escalation path to an admin console. Translations support placeholders
— think about what happens when they're rendered.

_Everything needed is inside the container — no external services or out-of-band
infrastructure._
