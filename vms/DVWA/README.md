### DVWA

A **fork of [Damn Vulnerable Web Application](https://github.com/digininja/DVWA)** (pinned to the
upstream **2.5** release), repackaged for appsec.study as a single self-contained container.
Apache, PHP and MariaDB all run inside one image — there is no separate database to wire up.

Live at **[dvwa.appsec.study](https://dvwa.appsec.study)** (restarted every 2 hours, like every
machine here).

### What this fork changes

Stock DVWA ships source only and expects you to install a database, copy and edit
`config.inc.php`, then click *Create / Reset Database* and log in. This fork makes it
zero-touch:

- **Single container** — bundles its own MariaDB; the Dockerfile pulls the 2.5 release tarball.
- **Database auto-provisioned** — the `dvwa` database and user are created on startup, and the
  tables are auto-seeded on first boot (no *Create / Reset Database* step).
- **Authentication disabled** — you land straight in the app, no login.
- **Security level defaults to `low`** — every module is exploitable out of the box.
- **PHP tuned for the modules** — `allow_url_include` on (for RFI), errors shown.

Everything else is upstream DVWA, unmodified.

### Run it locally

```
docker build -t dvwa ./vms/DVWA
docker run --rm -p 8080:80 dvwa
```

Then open http://localhost:8080 — that's it.

Raise the level from the *DVWA Security* page to practice the medium / high / impossible
variants. Database credentials default to `dvwa` / `p@ssw0rd` (database `dvwa`); the standard
`DB_SERVER`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` and `DEFAULT_SECURITY_LEVEL`
environment variables override at runtime.

Deliberately insecure by design — run it only on a local, isolated network, never exposed to
the internet.

### Upstream & licence

Source: [digininja/DVWA](https://github.com/digininja/DVWA), © the DVWA authors, distributed
under the GPLv3. This fork only adds the container packaging and the zero-touch setup described
above.
