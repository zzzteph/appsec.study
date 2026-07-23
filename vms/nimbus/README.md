# Nimbus ☁️

A cloud file-storage & sharing app — upload files, organize folders, share via
public links (with optional password) or with collaborators, comment, preview,
and import metadata. Behind it is an admin console. It behaves like a real
storage product, with a large surface of ordinary, correctly-built features.

> Deliberately insecure by design. For testing and training. Most of the app is
> hardened on purpose — the interesting bugs are in file access, sharing and
> processing.

## Run

```
docker build -t nimbus vms/nimbus && docker run --rm -p 8080:80 nimbus
# open http://localhost:8080   ·   demo / demo
```

State is rebuilt from a fixed seed on every start (live instance restarts every
2 hours).

## What it exercises

Object-level authorization on files and shares, the share model (public links,
passwords, collaborator permissions), file processing (import, preview), plus
classic injection and traversal leading to code execution. Change the IDs, poke
the share endpoints, and watch how files are processed.

_Everything needed is inside the container — the blind-XSS catcher and every
oracle are bundled; no external services or out-of-band infrastructure._
