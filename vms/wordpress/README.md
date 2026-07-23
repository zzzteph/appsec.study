# WordPress — Acme Member Portal

A real **WordPress** site (full CMS: posts, pages, comments, users, wp-admin) running a custom first-party plugin, **Acme Member Portal**, that adds a customer support area. Single self-contained container (Apache + PHP + MariaDB + WordPress), seeded on every boot.

## Run

```bash
docker build -t wordpress-nday .
docker run --rm -p 8080:80 wordpress-nday
# open http://localhost:8080   (give it ~10s to install + seed on first boot)
```

## Accounts

| Username | Password          | Role          |
|----------|-------------------|---------------|
| `admin`  | `Acme!Admin#2024` | Administrator |
| `sarah`  | `sunshine`        | Editor        |
| `mike`   | `Autumn2024!`     | Author        |
| `demo`   | `demo`            | Subscriber    |

wp-admin is at `/wp-admin/`. The **Member Support** page hosts the portal widgets.

## About

This is a realistic *vulnerable-plugin* scenario — WordPress core is current and configured normally; the deliberately-vulnerable code lives in the bundled **Acme Member Portal** plugin (`wp-content/plugins/acme-portal`), which is the kind of first-party/third-party plugin that dominates real-world WordPress compromises. The plugin exposes several unauthenticated `admin-ajax.php` actions and shortcodes.

Everything runs inside the container (no external services). The database and uploads are reset on every restart, so the target returns to a clean, deterministic state.

## Notes

Security training target with deliberately planted vulnerabilities. Run locally in a disposable container only.
