### lstalker

A variant of [Stalker](../Stalker/) — the same "looks like nothing, leaks its way open" cat site,
but with the chain rebuilt around a **cleartext password** and **no `.git`**. The intended path:

1. **SQL injection** — `index.php?id=` concatenates the id straight into
   `select id,source from pictures where id=$id` (numeric context, UNION-able).
2. **Credential disclosure** — the `users` table stores the admin password in **cleartext**, so a
   UNION dumps it directly (no cracking):
   `/?id=0 union select login,password from users` → the password appears as the image `src`.
3. **Content discovery** — the admin panel isn't linked and there's **no leaked Git** to point at it;
   find `/admin/panel/` by brute-forcing.
4. **Login** — the panel compares the password in cleartext, so `admin` / `123QWEasd` gets you in.
5. **RCE** — the authenticated panel runs `eval($_POST['code'])`. Read the flag from `flag.php`
   (it's in a PHP comment, so you need code execution): `echo file_get_contents('/app/flag.php');`.

Differences from Stalker: password is cleartext (was salted MD5), the admin login checks cleartext,
and the `.git` artifacts are removed — so this is a **SQLi → cleartext creds → hidden panel → RCE**
chain instead of a Git-recovery one.

Deliberately insecure by design — run only locally / on an isolated network.
