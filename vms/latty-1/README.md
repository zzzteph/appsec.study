### latty-1

**Latty-1** — a Vue 3 + Node/Express **blog** that is really a **lateral-movement chain**. No credentials
are given; you reach code execution by walking one step at a time. SQLite backend (real SQL injection).

```
docker build -t latty-1 ./vms/latty-1
docker run --rm -p 8080:80 latty-1      # http://localhost:8080
```

#### The chain: SQLi → cleartext creds → login → report generator → RCE

1. **SQL injection** (`VULN[sqli]`, `GET /api/search?q=`). The search query is string-concatenated and
   UNION-injectable (3 columns: `id,title,author`). Errors are returned verbatim (the SQL is echoed),
   which helps tune the payload:
   ```
   /api/search?q=x' UNION SELECT id,username,password FROM users --
   ```
   The `users.password` column is stored in **cleartext**, so the dump hands you every account —
   including **`admin`**.

2. **Login** with the dumped admin credentials at `POST /api/login` → JWT (role `admin`).

3. **Invoice / report generator** (`VULN[rce]`, admin-only `POST /api/reports/generate`). Templates use
   `{{ … }}` placeholders, but each placeholder is **evaluated as JavaScript** with Node globals in
   scope — a server-side template injection that escalates straight to command execution:
   ```json
   { "template": "{{ process.mainModule.require('child_process').execSync('id').toString() }}", "data": {} }
   ```

Each stage gates the next: no SQLi → no creds; no creds → no admin token; no token → the report
generator is 403. Deliberately insecure by design — run only locally / on an isolated network.
