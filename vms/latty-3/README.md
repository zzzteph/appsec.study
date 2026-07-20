### latty-3

**Latty-3** — a Vue 3 + Node/Express **contact-import + backup console**, and a **lateral-movement
chain** that starts with **XXE**. No credentials are given.

```
docker build -t latty-3 ./vms/latty-3
docker run --rm -p 8080:80 latty-3      # http://localhost:8080
```

#### The chain: XXE → leaked config creds → password reuse → backup RCE

1. **XXE** (`VULN[xxe]`, public `POST /api/import`). The contact importer parses XML with external-entity
   substitution enabled (`libxmljs2`, `noent + dtdload`). Declare an entity that points at the service
   config and place it in a field that gets echoed back:
   ```xml
   <?xml version="1.0"?>
   <!DOCTYPE c [ <!ENTITY xxe SYSTEM "file:///app/config/service.conf"> ]>
   <contact><name>&xxe;</name></contact>
   ```
   The response inlines `service.conf`, which contains `console.user=backup_admin` and
   `db.password=Kn0x-Backup-2024!`.

2. **Password reuse.** The admin console account (`backup_admin`) reuses the service **db password**.
   Sign in at `POST /api/admin/login` with `backup_admin` / `Kn0x-Backup-2024!`.

3. **Backup RCE** (`VULN[rce]`, admin-only `POST /api/admin/backup`). The archive name is concatenated
   straight into a shell command (`tar czf /tmp/<name>.tgz /app/config`):
   ```json
   { "name": "snap.tgz; id #" }
   ```
   → `id` runs on the server.

Deliberately insecure by design — run only locally / on an isolated network.
