"""Boxcutter Store - a deliberately vulnerable target for testing scanners.

This is NOT a teaching app: it exists so you can point boxcutter (or any
scanner) at it and measure what is and isn't discovered. Each planted weakness is
marked with a ``# VULN[id]`` comment; the README maps every id to the boxcutter
tool/workflow expected to find it. Some are made easy to find on purpose, some
are deliberately hard (blind-only, DOM-only, behind JWT, referenced only in JS).

Authorized testing only. Do not deploy on the public internet.
"""

from __future__ import annotations

import base64
import ipaddress
import json
import os
import pickle
import re
import sqlite3
import subprocess
import traceback
import unicodedata
from datetime import datetime, timedelta, timezone

import jwt
from flask import Flask, Response, jsonify, render_template_string, request

from db import DB_PATH, get_conn, init_db

app = Flask(__name__, static_folder="static", static_url_path="/static")

# VULN[secret-jwt]: signing secret is hardcoded AND leaked in /static/js/config.js
# and /actuator/env, so a tester can forge an admin token.
JWT_SECRET = "boxcutter-super-secret-key-2024"
FILES_DIR = os.path.join(os.path.dirname(__file__), "files")
SPA_INDEX = os.path.join(os.path.dirname(__file__), "static", "spa", "index.html")

# Request/access logging - one file per day, configurable via env:
#   BOXCUTTER_LOG_ENABLED=0   turn it off (default on)
#   BOXCUTTER_LOG_DIR=/path   where the daily files go (default ./logs)
LOG_ENABLED = os.environ.get("BOXCUTTER_LOG_ENABLED", "1").lower() not in ("0", "false", "no", "off")
LOG_DIR = os.environ.get("BOXCUTTER_LOG_DIR", os.path.join(os.path.dirname(__file__), "logs"))
if LOG_ENABLED:
    os.makedirs(LOG_DIR, exist_ok=True)


@app.after_request
def _access_log(resp):
    """Append every request (with query + body) to logs/requests-YYYY-MM-DD.log."""
    if not LOG_ENABLED:
        return resp
    body = ""
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        body = (request.get_data(as_text=True) or "")[:2000]
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
        "method": request.method,
        "path": request.full_path.rstrip("?"),
        "status": resp.status_code,
        "auth": bool(request.headers.get("Authorization")),
        "ua": request.headers.get("User-Agent", "")[:160],
        "body": body,
    }
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        with open(os.path.join(LOG_DIR, f"requests-{day}.log"), "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
    except OSError:
        pass
    return resp

BASE = """<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} - Boxcutter Store</title>
<meta name="description" content="Boxcutter Store - thoughtfully designed everyday goods, shipped carbon-neutral.">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>.card{{height:100%}} .ptile{{height:170px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.5rem}}</style>
</head><body>
<nav class="navbar is-white has-shadow" role="navigation" aria-label="main navigation"><div class="container">
  <div class="navbar-brand">
    <a class="navbar-item" href="/"><span class="icon-text has-text-weight-bold is-size-5"><span class="icon has-text-info"><i class="fas fa-cloud"></i></span><span>Boxcutter Store</span></span></a>
    <a role="button" class="navbar-burger" data-target="nav" aria-label="menu"><span></span><span></span><span></span></a>
  </div>
  <div id="nav" class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item" href="/">Shop</a>
      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">Categories</a>
        <div class="navbar-dropdown">
          <a class="navbar-item" href="/?category=apparel">Apparel</a>
          <a class="navbar-item" href="/?category=bags">Bags</a>
          <a class="navbar-item" href="/?category=home">Home</a>
          <a class="navbar-item" href="/?category=stationery">Stationery</a>
        </div>
      </div>
      <a class="navbar-item" href="/deals">Deals</a>
      <a class="navbar-item" href="/about">About</a>
      <a class="navbar-item" href="/contact">Contact</a>
    </div>
    <div class="navbar-end">
      <div class="navbar-item"><form action="/search" method="get"><div class="control has-icons-left">
        <input class="input" type="text" name="q" placeholder="Search products"><span class="icon is-left"><i class="fas fa-search"></i></span>
      </div></form></div>
      <div class="navbar-item"><div class="buttons">
        <a class="button is-light" href="/dashboard"><span class="icon"><i class="fas fa-user"></i></span></a>
        <a class="button is-info" href="/cart"><span class="icon"><i class="fas fa-shopping-bag"></i></span><span>Cart</span></a>
      </div></div>
    </div>
  </div>
</div></nav>
{body}
<footer class="footer"><div class="container"><div class="columns">
  <div class="column is-5">
    <p class="title is-5"><span class="icon has-text-info"><i class="fas fa-cloud"></i></span> Boxcutter Store</p>
    <p class="has-text-grey">Thoughtfully designed everyday goods. Shipped carbon-neutral from Portland, OR since 2014.</p>
  </div>
  <div class="column is-2"><p class="has-text-weight-semibold mb-2">Shop</p>
    <p><a href="/?category=apparel">Apparel</a></p><p><a href="/?category=bags">Bags</a></p><p><a href="/deals">Deals</a></p></div>
  <div class="column is-2"><p class="has-text-weight-semibold mb-2">Company</p>
    <p><a href="/about">About</a></p><p><a href="/contact">Contact</a></p><p><a href="/api/docs">Developers</a></p></div>
  <div class="column is-3"><p class="has-text-weight-semibold mb-2">Stay in touch</p>
    <div class="field has-addons"><div class="control is-expanded"><input class="input is-small" placeholder="you@email.com"></div><div class="control"><button class="button is-info is-small">Subscribe</button></div></div>
    <p class="is-size-7 has-text-grey mt-3">&copy; 2024 Boxcutter Store, Inc.<br><a href="/robots.txt">robots.txt</a> &middot; <a href="/api/docs">API</a></p></div>
</div></div></footer>
<script src="/static/js/config.js"></script>
<script src="/static/js/app.js"></script>
<script>document.addEventListener('DOMContentLoaded',function(){{var b=document.querySelector('.navbar-burger');if(b){{b.addEventListener('click',function(){{b.classList.toggle('is-active');document.getElementById('nav').classList.toggle('is-active');}});}}}});</script>
</body></html>"""

_CAT_COLOR = {"apparel": "#3273dc", "bags": "#23d160", "home": "#ff3860", "stationery": "#ffdd57", "": "#7957d5"}


def page(title: str, body: str) -> str:
    inner = f'<section class="section"><div class="container">{body}</div></section>'
    return BASE.format(title=title, body=inner)


def page_raw(title: str, body: str) -> str:
    return BASE.format(title=title, body=body)


def _card(r) -> str:
    color = _CAT_COLOR.get(r["category"], "#7957d5")
    return f"""<div class="column is-3"><div class="card">
      <div class="ptile" style="background:{color}"><i class="fas fa-box-open"></i></div>
      <div class="card-content">
        <p class="title is-6"><a href="/product?id={r['id']}">{r['name']}</a></p>
        <p class="subtitle is-6 has-text-grey">{r['category']}</p>
        <div class="level"><span class="has-text-weight-bold">${r['price']:.2f}</span>
          <a class="button is-info is-small" href="/product?id={r['id']}">View</a></div>
      </div></div></div>"""


# ============================ Storefront (server-rendered) ====================

@app.route("/")
def index():
    category = request.args.get("category", "")
    conn = get_conn()
    if category:
        rows = conn.execute("SELECT id, name, category, price, description FROM products WHERE category = ?",
                            (category,)).fetchall()
    else:
        rows = conn.execute("SELECT id, name, category, price, description FROM products").fetchall()
    conn.close()
    cards = "".join(_card(r) for r in rows)
    hero = """<section class="hero is-info is-bold"><div class="hero-body"><div class="container">
      <p class="title is-2">Everyday goods, thoughtfully made.</p>
      <p class="subtitle is-4">Free carbon-neutral shipping over $75. 30-day returns.</p>
      <a class="button is-light is-medium" href="/deals"><span class="icon"><i class="fas fa-tags"></i></span><span>Shop the deals</span></a>
    </div></div></section>"""
    tiles = """<section class="section"><div class="container"><div class="columns">
      <div class="column"><a href="/?category=apparel" class="box has-text-centered"><span class="icon is-large has-text-link"><i class="fas fa-tshirt fa-2x"></i></span><p class="mt-2">Apparel</p></a></div>
      <div class="column"><a href="/?category=bags" class="box has-text-centered"><span class="icon is-large has-text-success"><i class="fas fa-briefcase fa-2x"></i></span><p class="mt-2">Bags</p></a></div>
      <div class="column"><a href="/?category=home" class="box has-text-centered"><span class="icon is-large has-text-danger"><i class="fas fa-mug-hot fa-2x"></i></span><p class="mt-2">Home</p></a></div>
      <div class="column"><a href="/?category=stationery" class="box has-text-centered"><span class="icon is-large has-text-warning"><i class="fas fa-pen-nib fa-2x"></i></span><p class="mt-2">Stationery</p></a></div>
    </div></div></section>"""
    heading = f"{category.title()} products" if category else "Featured products"
    grid = f"""<section class="section"><div class="container">
      <h2 class="title is-4">{heading}</h2><div class="columns is-multiline">{cards}</div></div></section>"""
    return page_raw("Shop", hero + tiles + grid)


@app.route("/about")
def about():
    return page("About", """<h1 class="title">About Boxcutter Store</h1>
      <div class="content" style="max-width:720px">
        <p>Boxcutter started in a Portland garage in 2014 with a simple idea: everyday objects deserve to be
        well made. Today we ship to 40 countries, still carbon-neutral, still obsessed with the details.</p>
        <p>We're a team of 28 designers, makers and support folks. Have a question? Our
        <a href="/contact">support team</a> answers within one business day.</p>
        <h3>Our promise</h3>
        <ul><li>Free returns for 30 days</li><li>Carbon-neutral shipping</li><li>Repairs, not landfill</li></ul>
      </div>""")


@app.route("/contact")
def contact():
    sent = request.args.get("sent")
    note = '<div class="notification is-success">Thanks - we\'ll be in touch.</div>' if sent else ""
    return page("Contact", f"""<h1 class="title">Contact us</h1>{note}
      <form class="box" style="max-width:560px" action="/contact" method="get">
        <input type="hidden" name="sent" value="1">
        <div class="field"><label class="label">Name</label><div class="control"><input class="input" name="name"></div></div>
        <div class="field"><label class="label">Email</label><div class="control"><input class="input" name="email" type="email"></div></div>
        <div class="field"><label class="label">Message</label><div class="control"><textarea class="textarea" name="message"></textarea></div></div>
        <button class="button is-info">Send message</button>
      </form>
      <p class="has-text-grey">Or email <a href="mailto:support@boxcutter.test">support@boxcutter.test</a> &middot; Mon-Fri 9-5 PT.</p>""")


@app.route("/deals")
def deals():
    conn = get_conn()
    rows = conn.execute("SELECT id, name, category, price, description FROM products ORDER BY price DESC LIMIT 4").fetchall()
    conn.close()
    cards = "".join(_card(r) for r in rows)
    return page("Deals", f"""<h1 class="title">This week's deals</h1>
      <p class="subtitle">Up to 30% off selected items.</p>
      <div class="columns is-multiline">{cards}</div>""")


@app.route("/cart")
def cart():
    return page("Cart", """<h1 class="title">Your cart</h1>
      <div class="notification">Your cart is empty. <a href="/">Continue shopping</a>.</div>""")


@app.route("/search")
def search():
    q = request.args.get("q", "")
    conn = get_conn()
    # SQL is parameterised on purpose: this endpoint's only planted bug is XSS.
    rows = conn.execute("SELECT id, name, price FROM products WHERE name LIKE ?", (f"%{q}%",)).fetchall()
    conn.close()
    items = "".join(
        f'<tr><td><a href="/product?id={r["id"]}">{r["name"]}</a></td><td>${r["price"]:.2f}</td></tr>'
        for r in rows
    )
    # VULN[xss-reflected]: q echoed back unescaped.
    body = f"""<h1 class="title">Search</h1>
      <p class="subtitle">Results for: {q}</p>
      <table class="table is-fullwidth"><thead><tr><th>Product</th><th>Price</th></tr></thead>
      <tbody>{items}</tbody></table>"""
    return page("Search", body)


@app.route("/product")
def product():
    pid = request.args.get("id", "1")
    conn = get_conn()
    rows, err = [], None
    try:
        # VULN[sqli-blind] + VULN[sqli-time]: numeric id concatenated, no quotes.
        #   blind boolean:  ?id=1 AND 1=1   vs   ?id=1 AND 1=2
        #   time-based:     ?id=1 AND sleep(5)
        #   error-based:    ?id=1'
        sql = f"SELECT id, name, category, price, description FROM products WHERE id = {pid}"
        rows = conn.execute(sql).fetchall()
    except sqlite3.Error as e:
        err = f"SQL error: {e}"
    if err:
        conn.close()
        return page("Product", f'<div class="notification is-danger">{err}</div>')
    if not rows:
        conn.close()
        return page("Product", '<div class="notification">No such product.</div>')
    p = rows[0]
    conn.close()
    # Product fields come from the DB (not this request) - the only planted bug
    # on this endpoint is the SQLi via ?id above.
    body = f"""<h1 class="title">{p['name']}</h1>
      <p class="subtitle">${p['price']:.2f} &middot; {p['category']}</p>
      <p>{p['description']}</p>
      <a class="button is-link mt-4" href="/reviews?product_id={p['id']}">Read &amp; write reviews</a>"""
    return page(p["name"], body)


@app.route("/reviews")
def reviews_page():
    pid = request.args.get("product_id", "1")
    conn = get_conn()
    prod = conn.execute("SELECT id, name FROM products WHERE id = ?", (pid,)).fetchone()
    rev = conn.execute("SELECT author, body FROM reviews WHERE product_id = ?", (pid,)).fetchall()
    conn.close()
    name = prod["name"] if prod else "Product"
    # VULN[xss-stored]: stored review body rendered without escaping (sink is POST /review).
    rhtml = "".join(f'<div class="box"><strong>{r["author"]}</strong><p>{r["body"]}</p></div>' for r in rev)
    body = f"""<h1 class="title">Reviews — {name}</h1>{rhtml or '<p class="has-text-grey">No reviews yet.</p>'}
      <form class="box mt-4" action="/review" method="post">
        <input type="hidden" name="product_id" value="{pid}">
        <input class="input mb-2" name="author" placeholder="Your name">
        <textarea class="textarea mb-2" name="body" placeholder="Your review"></textarea>
        <button class="button is-info">Post review</button>
      </form>"""
    return page(f"Reviews — {name}", body)


@app.route("/review", methods=["POST"])
def review():
    conn = get_conn()
    # VULN[xss-stored]: body stored as-is, later rendered unescaped on /reviews.
    conn.execute(
        "INSERT INTO reviews (product_id, author, body) VALUES (?,?,?)",
        (request.form.get("product_id", "0"), request.form.get("author", "anon"), request.form.get("body", "")),
    )
    conn.commit()
    conn.close()
    return Response(status=302, headers={"Location": f"/reviews?product_id={request.form.get('product_id', '1')}"})


@app.route("/welcome")
def welcome():
    # VULN[xss-dom]: name is read from the query string IN THE BROWSER and written via
    # innerHTML by client JS - never appears in the server response, so it can only be
    # found by something that executes JS (tests the DOM-XSS blind spot).
    body = """<h1 class="title" id="greeting">Welcome!</h1>
      <script>
        var name = new URLSearchParams(location.search).get('name') || 'guest';
        document.getElementById('greeting').innerHTML = 'Welcome, ' + name + '!';
      </script>"""
    return page("Welcome", body)


@app.route("/greet")
def greet():
    name = request.args.get("name", "friend")
    # VULN[ssti]: user input concatenated into a Jinja2 template string -> {{7*7}} = 49.
    tmpl = "<section class='section'><h1 class='title'>Hi " + name + "</h1></section>"
    return render_template_string(tmpl)


@app.route("/download")
def download():
    name = request.args.get("file", "invoice-1001.txt")
    try:
        # VULN[path-traversal]: no sanitisation -> ?file=../../../../etc/passwd
        with open(os.path.join(FILES_DIR, name), "rb") as fh:
            return Response(fh.read(), mimetype="text/plain")
    except OSError as e:
        return Response(f"error: {e}", status=404, mimetype="text/plain")


@app.route("/login")
def login_page():
    return page("Sign in", """<h1 class="title">Sign in</h1>
      <form class="box" style="max-width:420px" onsubmit="return false">
        <input class="input mb-2" id="u" placeholder="Username" value="user">
        <input class="input mb-2" id="p" type="password" placeholder="Password" value="user">
        <button class="button is-info" onclick="doLogin()">Sign in</button>
        <p class="help" id="msg"></p>
        <p class="help has-text-grey mt-2">Demo account: <code>user</code> / <code>user</code></p>
      </form>
      <script src="/static/js/config.js"></script>
      <script>
        function doLogin(){fetch(API_BASE+'/login',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({username:u.value,password:p.value})}).then(r=>r.json())
          .then(d=>{ if(d.token){ localStorage.setItem('boxcutter_token', d.token); location='/dashboard'; }
                     else { msg.innerHTML = 'Login failed'; } });}
      </script>""")


# ============================ SPA (client-rendered) ===========================

@app.route("/dashboard")
@app.route("/app")
def dashboard():
    # The authenticated account area is a built Vue SPA (test/frontend -> static/spa).
    if os.path.exists(SPA_INDEX):
        with open(SPA_INDEX, encoding="utf-8") as fh:
            return fh.read()
    return page("Account", '<div class="notification is-warning">The account app is not built. '
                'Use the Docker image, or run <code>npm --prefix frontend install &amp;&amp; '
                'npm --prefix frontend run build</code>.</div>')


# ============================ Hidden / debug pages ============================

@app.route("/admin")
def admin():
    # VULN[hidden-admin]: unauthenticated admin panel (found via dir brute-force).
    conn = get_conn()
    users = conn.execute("SELECT id, username, role, email, api_token FROM users").fetchall()
    conn.close()
    rows = "".join(f"<tr><td>{u['id']}</td><td>{u['username']}</td><td>{u['role']}</td>"
                   f"<td>{u['email']}</td><td><code>{u['api_token']}</code></td></tr>" for u in users)
    return page("Admin", f"""<h1 class="title">Admin &middot; Users</h1>
      <table class="table is-fullwidth"><thead><tr><th>ID</th><th>User</th><th>Role</th><th>Email</th><th>API token</th></tr></thead>
      <tbody>{rows}</tbody></table>""")


@app.route("/debug")
def debug():
    # VULN[hidden-debug]: dumps request + config (found via dir brute-force).
    return jsonify({
        "ok": True, "env": dict(list(os.environ.items())[:20]),
        "jwt_secret": JWT_SECRET, "db": DB_PATH,
        "headers": dict(request.headers), "remote": request.remote_addr,
    })


@app.route("/server-status")
def server_status():
    return Response("Apache Server Status\nServer Version: Apache/2.4.41\nCurrent Time: now\n", mimetype="text/plain")


# ---- exposed files: content lives in test/exposed/*, served at these paths with
# ---- the right content-type so exposure templates / dir brute-force pick them up ----

EXPOSED_DIR = os.path.join(os.path.dirname(__file__), "exposed")
_EXPOSED = {
    "/.env": ("dotenv", "text/plain"),                       # VULN[exposed-env]
    "/backup.sql": ("backup.sql", "text/plain"),             # VULN[exposed-backup]
    "/config.bak": ("config.bak", "text/plain"),
    "/.git/config": ("git-config", "text/plain"),            # VULN[exposed-git] (leaked CI token)
    "/.git/HEAD": ("git-HEAD", "text/plain"),
    "/robots.txt": ("robots.txt", "text/plain"),
    "/security.txt": ("security.txt", "text/plain"),
    "/.well-known/security.txt": ("security.txt", "text/plain"),
    "/phpinfo": ("phpinfo.html", "text/html"),               # VULN[exposed-phpinfo]
    "/phpinfo.php": ("phpinfo.html", "text/html"),
}


def _serve_exposed(filename, mimetype):
    def view():
        with open(os.path.join(EXPOSED_DIR, filename), "rb") as fh:
            return Response(fh.read(), mimetype=mimetype)
    return view


for _path, (_fname, _ct) in _EXPOSED.items():
    app.add_url_rule(_path, endpoint="exposed_" + _path.strip("/").replace("/", "_").replace(".", "_"),
                     view_func=_serve_exposed(_fname, _ct))


# ============================ Spring-style actuators =========================

def _actuator(payload):
    # Real Spring Boot actuator content type - nuclei's springboot templates match on it.
    return Response(json.dumps(payload), mimetype="application/vnd.spring-boot.actuator.v3+json")


@app.route("/actuator")
def actuator_index():
    base = request.host_url.rstrip("/")
    links = {n: {"href": f"{base}/actuator/{n}"} for n in
             ["health", "info", "env", "configprops", "mappings", "metrics", "loggers", "heapdump", "threaddump"]}
    return _actuator({"_links": {"self": {"href": f"{base}/actuator"}, **links}})


@app.route("/actuator/health")
def actuator_health():
    return _actuator({"status": "UP", "components": {"db": {"status": "UP"}, "diskSpace": {"status": "UP"}}})


@app.route("/actuator/info")
def actuator_info():
    return _actuator({"app": {"name": "boxcutter-store", "version": "2.3.1", "encoding": "UTF-8"}})


@app.route("/actuator/env")
def actuator_env():
    # VULN[actuator-env]: leaks secrets (classic Spring Boot actuator exposure).
    return _actuator({"activeProfiles": ["production"], "propertySources": [
        {"name": "systemEnvironment", "properties": {
            "JWT_SECRET": {"value": JWT_SECRET},
            "STRIPE_SECRET": {"value": "sk_live_4eC39HqLyjWDarjtT1zdp7dc"},
            "AWS_ACCESS_KEY_ID": {"value": "AKIAIOSFODNN7EXAMPLE"},
            "DB_DATABASE": {"value": DB_PATH},
        }}]})


@app.route("/actuator/configprops", strict_slashes=False)
def actuator_configprops():
    # VULN[actuator-configprops]: a path-based access rule guards the EXACT path
    # /actuator/configprops (-> 401), but the very same handler is reachable with a
    # trailing slash (/actuator/configprops/), which the rule never matched -> the
    # bound, runtime-resolved production secrets leak. Classic Spring Security /
    # proxy ACL trailing-slash bypass (see SECAPP-3282).
    if not request.path.endswith("/"):
        return Response('{"timestamp":"2024-01-01T00:00:00Z","status":401,"error":"Unauthorized","path":"/actuator/configprops"}',
                        status=401, mimetype="application/vnd.spring-boot.actuator.v3+json")
    return _actuator({"contexts": {"application": {"beans": {
        "spring.kafka-org.springframework.boot.autoconfigure.kafka.KafkaProperties": {"properties": {
            "bootstrapServers": ["pkc-2rqw2.eu-west-1.aws.confluent.cloud:9092"],
            "properties": {"sasl.mechanism": "PLAIN", "security.protocol": "SASL_SSL",
                           "sasl.jaas.config": "org.apache.kafka.common.security.plain.PlainLoginModule required "
                                               "username='OA2H4NDEHYAYXFZJ' password='" + JWT_SECRET + "';"}}},
        "security.oauth2-org.springframework.boot.autoconfigure.security.oauth2.OAuth2Properties": {"properties": {
            "issuerUri": "https://boxcutter.okta-emea.com/oauth2/default", "jwsAlgorithm": "RS256"}},
        "store.signing-com.boxcutter.config.SigningProperties": {"properties": {"jwtSecret": JWT_SECRET}},
    }}}})


@app.route("/actuator/mappings")
def actuator_mappings():
    return _actuator({"contexts": {"application": {"mappings": {"dispatcherServlets": {"dispatcherServlet": [
        {"handler": "ProductController#search", "predicate": "/api/products"},
        {"handler": "AdminController#users", "predicate": "/api/admin/search"},
        {"handler": "InternalController#debug", "predicate": "/api/internal/debug"},
    ]}}}}})


@app.route("/actuator/heapdump")
def actuator_heapdump():
    # VULN[actuator-heapdump]: classic info-leak endpoint; returns a binary blob.
    blob = b"JAVA PROFILE 1.0.2\x00" + (b"heap-snapshot-boxcutter " * 64) + JWT_SECRET.encode()
    return Response(blob, mimetype="application/octet-stream",
                    headers={"Content-Disposition": "attachment; filename=heapdump"})


@app.route("/actuator/loggers")
def actuator_loggers():
    return _actuator({"levels": ["OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"],
                      "loggers": {"ROOT": {"configuredLevel": "INFO", "effectiveLevel": "INFO"}}})


@app.route("/actuator/metrics")
def actuator_metrics():
    return _actuator({"names": ["jvm.memory.used", "http.server.requests", "process.cpu.usage"]})


@app.route("/actuator/threaddump")
def actuator_threaddump():
    return _actuator({"threads": [{"threadName": "http-nio-8080-exec-1", "threadState": "RUNNABLE"}]})


# ============================ more storefront features ======================

@app.route("/api/categories")
def api_categories():
    conn = get_conn()
    rows = conn.execute("SELECT DISTINCT category FROM products ORDER BY category").fetchall()
    conn.close()
    return jsonify({"categories": [r["category"] for r in rows]})


@app.route("/api/newsletter", methods=["POST"])
def api_newsletter():
    email = (request.get_json(silent=True) or {}).get("email", "")
    return jsonify({"subscribed": bool(email), "email": email})


@app.route("/api/status")
def api_status():
    return jsonify({"service": "boxcutter-store", "version": "2.3.1", "status": "ok", "uptime_s": 86400})


@app.route("/redirect")
def open_redirect():
    # VULN[open-redirect]: unvalidated redirect target (e.g. ?url=https://evil.example).
    target = request.args.get("url", request.args.get("next", "/"))
    return Response(status=302, headers={"Location": target})


@app.route("/sitemap.xml")
def sitemap():
    base = request.host_url.rstrip("/")
    paths = ["/", "/about", "/contact", "/deals", "/blog", "/help", "/api/docs"]
    body = ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{base}{p}</loc></url>\n" for p in paths) + "</urlset>\n")
    return Response(body, mimetype="application/xml")


_BLOG = {
    "welcome-to-boxcutter": ("Welcome to Boxcutter Store", "We started in a Portland garage in 2014..."),
    "spring-sale": ("Our biggest Spring sale yet", "Up to 30% off selected items this week."),
    "sustainability": ("How we ship carbon-neutral", "Every order is offset at the source."),
}


@app.route("/blog")
def blog():
    cards = "".join(f'<div class="box"><a href="/blog/post?slug={s}"><p class="title is-5">{t}</p></a>'
                    f'<p class="has-text-grey">Read more...</p></div>' for s, (t, _) in _BLOG.items())
    return page("Blog", f'<h1 class="title">From the blog</h1>{cards}')


@app.route("/blog/post")
def blog_post():
    slug = request.args.get("slug", "welcome-to-boxcutter")
    if slug not in _BLOG:
        return page("Not found", '<div class="notification">Post not found.</div>')
    title, body = _BLOG[slug]
    return page(title, f'<h1 class="title">{title}</h1><p class="content">{body}</p>'
                       f'<a href="/blog">&larr; Back to blog</a>')


# ============================ REST API (OpenAPI) =============================

def _issue_token(username: str, role: str) -> str:
    return jwt.encode({"sub": username, "role": role}, JWT_SECRET, algorithm="HS256")


def _require_jwt():
    """Return (claims, None) or (None, error_response)."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, (jsonify({"error": "missing bearer token"}), 401)
    try:
        return jwt.decode(auth.split(" ", 1)[1], JWT_SECRET, algorithms=["HS256"]), None
    except jwt.PyJWTError as e:
        return None, (jsonify({"error": f"invalid token: {e}"}), 401)


@app.route("/api/products")
def api_products():
    q = request.args.get("q", "")
    sort = request.args.get("sort", "")
    conn = get_conn()
    try:
        # VULN[api-sqli]: error-based SQLi in `q`; VULN[sort-injection]: `sort` concatenated
        # into ORDER BY (e.g. sort=(CASE WHEN ... )) - injection that isn't in a WHERE clause.
        order = f" ORDER BY {sort}" if sort else ""
        sql = f"SELECT id, name, price, internal_sku FROM products WHERE name LIKE '%{q}%'{order}"
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
        conn.close()
        return jsonify({"products": rows})
    except sqlite3.Error as e:
        conn.close()
        # VULN[api-error-disclosure]: raw SQL error returned to the client.
        return jsonify({"error": str(e), "query": sql}), 500


@app.route("/api/products/<int:pid>")
def api_product(pid):
    conn = get_conn()
    row = conn.execute("SELECT id, name, price, category FROM products WHERE id = ?", (pid,)).fetchone()
    conn.close()
    return (jsonify(dict(row)) if row else (jsonify({"error": "not found"}), 404))


@app.route("/api/users/<int:uid>")
def api_user(uid):
    # VULN[api-idor]: any user's record (incl. api_token) returned with no auth and
    # no ownership check - just increment the id. (Parameterised: no SQLi here.)
    conn = get_conn()
    row = conn.execute("SELECT id, username, email, role, full_name, api_token FROM users WHERE id = ?",
                       (uid,)).fetchone()
    conn.close()
    return jsonify(dict(row)) if row else (jsonify({"error": "not found"}), 404)


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    conn = get_conn()
    row = conn.execute("SELECT username, role FROM users WHERE username = ? AND password = ?",
                       (data.get("username"), data.get("password"))).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "invalid credentials"}), 401
    return jsonify({"token": _issue_token(row["username"], row["role"]), "role": row["role"]})


@app.route("/api/auth/token")
def api_jwt_test():
    # VULN[jwt-test]: hands out a valid low-priv JWT with no credentials. Tagged
    # "JWTTest" in the OpenAPI spec so a scanner can grab a token to test authed routes.
    return jsonify({"token": _issue_token("guest", "user"), "note": "ephemeral test token"})


@app.route("/api/me")
def api_me():
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    row = conn.execute("SELECT id, username, email, role FROM users WHERE username = ?",
                       (claims.get("sub"),)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"sub": claims.get("sub"), "role": claims.get("role")})


@app.route("/api/profile", methods=["GET", "POST"])
def api_profile():
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        # VULN[xss-stored-spa]: bio saved as-is, later rendered with Vue v-html in the
        # SPA. (role is NOT accepted here - mass assignment lives on /api/account.)
        sets, vals = [], []
        for k in ("bio", "full_name", "email"):
            if k in data:
                sets.append(f"{k} = ?")
                vals.append(data[k])
        if sets:
            vals.append(claims.get("sub"))
            conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE username = ?", vals)
            conn.commit()
    row = conn.execute("SELECT id, username, email, role, full_name, bio FROM users WHERE username = ?",
                       (claims.get("sub"),)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {})


@app.route("/api/orders/<oid>")
def api_order(oid):
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    # VULN[api-idor-jwt]: any valid token reads ANY order - no ownership check.
    # (Parameterised: the only bug here is the missing authorization, not SQLi.)
    row = conn.execute("SELECT id, user_id, item, total, address, card_last4 FROM orders WHERE id = ?",
                       (oid,)).fetchone()
    conn.close()
    return jsonify({"orders": [dict(row)] if row else []})


@app.route("/api/admin/search")
def api_admin_search():
    claims, err = _require_jwt()
    if err:
        return err
    q = request.args.get("q", "")
    conn = get_conn()
    try:
        # VULN[api-sqli-jwt]: authenticated SQLi (any valid token), error-based.
        sql = f"SELECT id, username, email, role FROM users WHERE username LIKE '%{q}%'"
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
        conn.close()
        return jsonify({"users": rows})
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e), "query": sql}), 500


@app.route("/api/admin/users")
def api_admin_users():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[access-vertical]: requires role=admin - reachable by forging the JWT with
    # the leaked secret (privilege escalation), not by the JWTTest 'user' token.
    if claims.get("role") != "admin":
        return jsonify({"error": "admin role required"}), 403
    conn = get_conn()
    rows = [dict(r) for r in conn.execute("SELECT id, username, email, role, api_token FROM users").fetchall()]
    conn.close()
    return jsonify({"users": rows})


@app.route("/api/tools/dns")
def api_tools_dns():
    host = request.args.get("host", "example.com")
    # VULN[cmd-injection]: host is passed to a shell -> `;id`, `|whoami`, `;sleep 5`.
    try:
        out = subprocess.run(f"echo Resolving {host}", shell=True, capture_output=True, timeout=12, text=True)
        return jsonify({"host": host, "output": out.stdout + out.stderr})
    except subprocess.TimeoutExpired:
        return jsonify({"host": host, "output": "timeout"}), 504


@app.route("/api/v2/login", methods=["POST"])
def api_v2_login():
    data = request.get_json(silent=True) or {}
    u, p = data.get("username"), data.get("password")
    # VULN[nosql-injection]: emulates Mongo-style operator handling.
    #   {"username":"admin","password":{"$ne":null}}  -> auth bypass
    #   a value containing a quote / $where           -> Mongo-style error (error-based)
    def bad(v):
        return isinstance(v, str) and ("'" in v or '"' in v or "$where" in v)
    if bad(u) or bad(p):
        return jsonify({"error": "MongoError: unterminated string literal / unknown operator $where"}), 500
    op_bypass = isinstance(u, dict) or isinstance(p, dict)
    conn = get_conn()
    if op_bypass:
        row = conn.execute("SELECT username, role FROM users ORDER BY id LIMIT 1").fetchone()
    else:
        row = conn.execute("SELECT username, role FROM users WHERE username=? AND password=?", (u, p)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "invalid credentials"}), 401
    return jsonify({"token": _issue_token(row["username"], row["role"]), "bypassed": op_bypass})


@app.route("/api/account", methods=["POST"])
def api_account():
    claims, err = _require_jwt()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    # VULN[mass-assignment]: every posted field is accepted, including role / is_admin.
    accepted = {k: data[k] for k in ("email", "full_name", "role", "is_admin") if k in data}
    return jsonify({"updated": accepted, "effective_role": data.get("role", claims.get("role"))})


@app.route("/api/files")
def api_files():
    name = request.args.get("name", "invoice-1001.txt")
    # VULN[path-traversal-filter]: strips "../" exactly once -> "....//" bypasses it.
    safe = name.replace("../", "")
    try:
        with open(os.path.join(FILES_DIR, safe), "rb") as fh:
            return Response(fh.read(), mimetype="text/plain")
    except OSError as e:
        return Response(f"error: {e}", status=404, mimetype="text/plain")


@app.route("/api/admin/stats")
def api_admin_stats():
    # VULN[access-header]: authorization decided by a client-controlled header.
    if request.headers.get("X-Admin", "").lower() != "true":
        return jsonify({"error": "forbidden"}), 403
    conn = get_conn()
    n = conn.execute("SELECT count(*) c FROM users").fetchone()["c"]
    conn.close()
    return jsonify({"users": n, "revenue": 18230.50, "flag": "FLAG{broken-access-control}"})


# ---- hidden API routes (NOT in the OpenAPI spec; only referenced from app.js) ----

@app.route("/api/internal/debug")
def api_internal_debug():
    # VULN[hidden-api]: only discoverable from /static/js/app.js or /actuator/mappings.
    return jsonify({"jwt_secret": JWT_SECRET, "users_table": "users", "build": "2.3.1-internal"})


@app.route("/api/v1/users")
def api_v1_users():
    conn = get_conn()
    rows = [dict(r) for r in conn.execute("SELECT id, username, email, role, api_token FROM users").fetchall()]
    conn.close()
    return jsonify({"users": rows})


@app.route("/api/openapi.json")
def openapi():
    return jsonify(OPENAPI)


@app.route("/api/docs")
def api_docs():
    # VULN[swagger-dom-xss]: Swagger UI lets the spec location be overridden with
    # ?url= / ?configUrl=, and that value is dropped into the inline initialiser
    # unescaped -> a crafted value breaks out of the JS string and runs script.
    #   /api/docs?url=';alert(document.domain)//
    # (Recurring JET finding: Swagger-UI ?url=/?configUrl= XSS.)
    spec = request.args.get("configUrl") or request.args.get("url") or "/api/openapi.json"
    return page("API docs", f"""<div id="swagger"></div>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>SwaggerUIBundle({{url:'{spec}',dom_id:'#swagger'}});</script>""")


# ============================ GraphQL =======================================

# ============================ help centre CMS + profile update ==============

@app.route("/help")
def help_page():
    # The help centre is a thin client over the GraphQL CMS: it fetches the published
    # articles and renders each article's body. Because body is attacker-editable via the
    # unauthenticated updateHelpArticle mutation and rendered as raw HTML -> stored XSS.
    return page("Help centre", """<h1 class="title">Help centre</h1>
      <p class="subtitle">Answers to common questions.</p>
      <div id="topics"><progress class="progress"></progress></div>
      <script>
        fetch('/graphql', {method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({query:'{ helpArticles { slug title body } }'})})
          .then(function(r){return r.json();}).then(function(d){
            var a = (d.data && d.data.helpArticles) || [];
            document.getElementById('topics').innerHTML = a.map(function(x){
              return '<div class="box"><h2 class="title is-5">'+x.title+'</h2>'+x.body+'</div>'; }).join('');
          });
      </script>""")


@app.route("/api/profile/update", methods=["POST", "PUT"])
def profile_update():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    uid = d.get("user_id", d.get("id"))
    # VULN[idor-profile-update]: the target user is taken from the request body with NO
    # check that it matches the caller - any signed-in user can change anyone's name /
    # email / bio just by passing their id.
    fields, vals = [], []
    for k in ("full_name", "email", "bio"):
        if k in d:
            fields.append(f"{k} = ?")
            vals.append(d[k])
    if uid is None or not fields:
        return jsonify({"error": "user_id and at least one field are required"}), 400
    vals.append(uid)
    conn = get_conn()
    conn.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = ?", vals)
    conn.commit()
    row = conn.execute("SELECT id, username, email, full_name, bio FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return jsonify({"updated": dict(row) if row else None})


def _gqt(name, kind="OBJECT"):
    return {"name": name, "kind": kind, "ofType": None}


def _gqf(name, ret, args=()):
    return {"name": name, "type": ret, "args": [{"name": an, "type": at} for an, at in args]}


_ID, _STR, _BOOL = _gqt("ID", "SCALAR"), _gqt("String", "SCALAR"), _gqt("Boolean", "SCALAR")
_USER, _ORDER, _ART, _SYS = _gqt("User"), _gqt("Order"), _gqt("HelpArticle"), _gqt("SystemInfo")


def _gqobj(name, *leaves):
    return {"name": name, "kind": "OBJECT", "fields": [_gqf(n, _STR) for n in leaves]}


# Faithful-ish introspection so a schema-aware client (e.g. boxcutter graphql-audit)
# can build valid queries against the resolvers below.
_GQL_SCHEMA = {
    "queryType": {"name": "Query"}, "mutationType": {"name": "Mutation"}, "types": [
        _gqobj("User", "id", "username", "email", "role", "api_token"),
        _gqobj("Order", "id", "item", "total", "address", "card_last4"),
        _gqobj("HelpArticle", "id", "slug", "title", "body", "published"),
        _gqobj("SystemInfo", "version", "jwtSecret", "dbPath", "flag"),
        {"name": "Query", "kind": "OBJECT", "fields": [
            _gqf("user", _USER, [("id", _ID)]), _gqf("users", _USER),
            _gqf("order", _ORDER, [("id", _ID)]),
            _gqf("helpArticle", _ART, [("slug", _STR)]), _gqf("helpArticles", _ART),
            _gqf("systemInfo", _SYS)]},
        {"name": "Mutation", "kind": "OBJECT", "fields": [
            _gqf("setRole", _BOOL, [("username", _STR), ("role", _STR)]),
            _gqf("updateHelpArticle", _ART, [("slug", _STR), ("body", _STR)])]},
    ]}


@app.route("/graphql", methods=["GET", "POST"])
def graphql():
    if request.method == "GET":
        query = request.args.get("query", "")
        if not query:
            return page("GraphQL", "<h1 class='title'>GraphQL</h1><p>POST { query } to this endpoint.</p>")
        # VULN[graphql-csrf]: queries AND mutations are accepted over GET, with no CSRF token.
    else:
        query = (request.get_json(silent=True) or {}).get("query", "") or request.data.decode("utf-8", "replace")
    try:
        import re
        # __typename meta field (supports aliasing, so batching checks resolve)
        if "__typename" in query and "__schema" not in query:
            aliases = re.findall(r"(\w+)\s*:\s*__typename", query)
            if aliases:
                return jsonify({"data": {a: "Query" for a in aliases}})
            return jsonify({"data": {"__typename": "Query"}})
        # VULN[graphql-introspection]: schema introspection left enabled (full schema + args/types).
        if "__schema" in query or "__type" in query:
            return jsonify({"data": {"__schema": _GQL_SCHEMA}})
        # a bare mutation with no args -> GraphQL-style "argument required" validation error,
        # so a dry-probe sees the mutation is reachable WITHOUT executing it.
        bare = re.search(r"mutation\s*\{\s*(\w+)\s*\}", query)
        if bare and bare.group(1) in ("setRole", "updateHelpArticle"):
            arg = "username" if bare.group(1) == "setRole" else "slug"
            return jsonify({"errors": [{"message": f'Field "{bare.group(1)}" argument "{arg}" '
                                        f'of type "String!" is required but not provided'}]}), 400
        # VULN[graphql-secret-field]: a query field that returns server secrets.
        if "systemInfo" in query or "serverConfig" in query:
            return jsonify({"data": {"systemInfo": {"version": "2.3.1", "jwtSecret": JWT_SECRET,
                "dbPath": DB_PATH, "flag": "FLAG{graphql-field-leaks-secrets}"}}})
        # VULN[graphql-mutation-access]: unauthenticated role change (privilege escalation).
        mut = re.search(r'setRole\(\s*username\s*:\s*"?([^",)]+)"?\s*,\s*role\s*:\s*"?([^",)]+)"?', query)
        if mut:
            conn = get_conn()
            conn.execute("UPDATE users SET role = ? WHERE username = ?", (mut.group(2), mut.group(1)))
            conn.commit()
            conn.close()
            return jsonify({"data": {"setRole": {"username": mut.group(1), "role": mut.group(2), "ok": True}}})
        # VULN[graphql-batching]: many aliased user(id:) calls in one request all run
        # (no cost/alias limit) - enables brute force / mass extraction in one query.
        ids = re.findall(r'user\(\s*id\s*:\s*"?([^")]+)"?\s*\)', query)
        if ids:
            conn = get_conn()
            rows = []
            for uid in ids:
                # VULN[graphql-sqli] + VULN[graphql-idor]: arg concatenated, any user, no auth.
                sql = f"SELECT id, username, email, role, api_token FROM users WHERE id = {uid}"
                rows += [dict(r) for r in conn.execute(sql).fetchall()]
            conn.close()
            return jsonify({"data": {"user": rows}})
        # VULN[graphql-sqli] + VULN[graphql-idor]: order(id:) concatenated, any order.
        order_m = re.search(r'order\(\s*id\s*:\s*"?([^")]+)"?\s*\)', query)
        if order_m:
            conn = get_conn()
            try:
                sql = f"SELECT id, item, total, address, card_last4 FROM orders WHERE id = {order_m.group(1)}"
                rows = [dict(r) for r in conn.execute(sql).fetchall()]
                conn.close()
                return jsonify({"data": {"order": rows}})
            except sqlite3.Error as e:
                conn.close()
                return jsonify({"errors": [{"message": str(e)}]}), 500
        # --- Help centre CMS (headless-CMS style content type, stored in the DB) ---
        if "helpArticles" in query:
            conn = get_conn()
            rows = [dict(r) for r in conn.execute(
                "SELECT id, slug, title, body, published FROM help_articles").fetchall()]
            conn.close()
            return jsonify({"data": {"helpArticles": rows}})
        art_m = re.search(r'helpArticle\(\s*slug\s*:\s*"([^"]+)"', query)
        if art_m:
            conn = get_conn()
            r = conn.execute("SELECT id, slug, title, body, published FROM help_articles WHERE slug = ?",
                             (art_m.group(1),)).fetchone()
            conn.close()
            return jsonify({"data": {"helpArticle": dict(r) if r else None}})
        # VULN[graphql-cms]: the content-editing mutation has NO auth - anyone can rewrite
        # published help articles (the /help page renders body as raw HTML -> stored XSS).
        upd_m = re.search(r'updateHelpArticle\(\s*slug\s*:\s*"([^"]+)"\s*,\s*body\s*:\s*"((?:[^"\\]|\\.)*)"', query)
        if upd_m:
            slug = upd_m.group(1)
            body = upd_m.group(2).replace('\\"', '"').replace("\\n", "\n").replace("\\\\", "\\")
            conn = get_conn()
            conn.execute("UPDATE help_articles SET body = ? WHERE slug = ?", (body, slug))
            conn.commit()
            r = conn.execute("SELECT id, slug, title, body, published FROM help_articles WHERE slug = ?",
                             (slug,)).fetchone()
            conn.close()
            if r:
                return jsonify({"data": {"updateHelpArticle": dict(r)}})
            return jsonify({"errors": [{"message": "no such article"}]}), 404
        if "users" in query:
            conn = get_conn()
            rows = [dict(r) for r in conn.execute("SELECT id, username, email, role FROM users").fetchall()]
            conn.close()
            return jsonify({"data": {"users": rows}})
        return jsonify({"errors": [{"message": "Cannot parse query"}]}), 400
    except Exception as e:  # noqa: BLE001
        # VULN[graphql-error-disclosure]: full traceback returned.
        return jsonify({"errors": [{"message": str(e), "trace": traceback.format_exc()}]}), 500


# ============================ store API resources ===========================
# Ordinary-looking endpoints that behave normally for valid input but each hide
# one bug, reachable over GET / PUT / POST / DELETE. Half require a bearer JWT
# (mint one from /api/auth/token). Names give nothing away on purpose - a scanner
# has to actually probe them.

_METHODS = ["GET", "PUT", "POST", "DELETE"]


def _field(*names, default=""):
    """Read a value from the JSON body (POST/PUT) or query string (GET/DELETE)."""
    if request.is_json:
        body = request.get_json(silent=True) or {}
        for n in names:
            if body.get(n) is not None:
                return str(body[n])
    for n in names:
        v = request.args.get(n)
        if v is not None:
            return v
    return default


def _action():
    return {"GET": "fetched", "POST": "created", "PUT": "updated", "DELETE": "deleted"}[request.method]


def _needs_auth(requires_auth):
    if requires_auth:
        _claims, err = _require_jwt()
        return err
    return None


def _promos_view(requires_auth):
    def view():
        if (err := _needs_auth(requires_auth)):
            return err
        code = _field("code", default="")
        conn = get_conn()
        try:
            # VULN[res-sqli]: promo code concatenated. A normal code just misses -> valid:false.
            sql = f"SELECT name FROM products WHERE internal_sku = 'PROMO-{code}'"
            rows = [dict(r) for r in conn.execute(sql).fetchall()]
            conn.close()
            return jsonify({"action": _action(), "code": code, "valid": bool(rows),
                            "discount_pct": 15 if rows else 0})
        except sqlite3.Error as e:
            conn.close()
            return jsonify({"error": str(e)}), 400
    return view


def _orders_filter_view(requires_auth):
    def view():
        if (err := _needs_auth(requires_auth)):
            return err
        status = _field("status", "q", default="")
        conn = get_conn()
        try:
            # VULN[res-sqli]: filter value concatenated. Normal text -> matching orders.
            where = f" WHERE item LIKE '%{status}%'" if status else ""
            sql = f"SELECT id, item, total FROM orders{where}"
            rows = [dict(r) for r in conn.execute(sql).fetchall()]
            conn.close()
            return jsonify({"action": _action(), "filter": status, "orders": rows})
        except sqlite3.Error as e:
            conn.close()
            return jsonify({"error": str(e)}), 400
    return view


def _preview_view(requires_auth):
    def view():
        if (err := _needs_auth(requires_auth)):
            return err
        msg = _field("message", "signature", default="Hi {{ customer }}, thanks for shopping at {{ store }}!")
        try:
            # VULN[res-ssti]: message rendered as a template. {{ customer }} / {{ store }}
            # placeholders are a feature; arbitrary expressions are the bug.
            preview = render_template_string(msg, customer="valued customer", store="Boxcutter Store")
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": str(e)}), 400
        return jsonify({"action": _action(), "preview": preview})
    return view


def _calc_view(requires_auth, field, label):
    def view():
        if (err := _needs_auth(requires_auth)):
            return err
        raw = _field(field, default="1")
        try:
            n = float(raw)
            return jsonify({"action": _action(), field: n, "amount": round(n * 1.5 + 4.99, 2), "label": label})
        except ValueError as e:
            # VULN[res-error]: verbose error leaks secrets / internal config.
            return jsonify({"error": f"{label} engine error: {e}", "debug": {
                "jwt_secret": JWT_SECRET, "db": DB_PATH, "internal_api_key": "bc_internal_7f3c1aa1bb22",
                "flag": "FLAG{verbose-errors-leak-secrets}"}}), 500
    return view


def _track_view(requires_auth):
    def view():
        if (err := _needs_auth(requires_auth)):
            return err
        oid = _field("order", "id", default="1001")
        conn = get_conn()
        row = conn.execute("SELECT id, item, total, address, card_last4 FROM orders WHERE id = ?",
                           (oid,)).fetchone()
        conn.close()
        if not row:
            return jsonify({"order": None, "status": "not_found"}), 404
        # VULN[res-idor]: any order id, no ownership check (leaks address + card).
        return jsonify({"action": _action(), "order": dict(row), "status": "in_transit", "carrier": "BoxPost"})
    return view


# (path, view, requires_auth, OpenAPI summary, primary field)
_RESOURCES = [
    ("/api/promos", _promos_view(False), False, "Validate a promo code", "code"),
    ("/api/account/orders", _orders_filter_view(True), True, "Filter my orders", "status"),
    ("/api/messages/preview", _preview_view(False), False, "Preview a templated message", "message"),
    ("/api/account/signature", _preview_view(True), True, "Update my email signature", "signature"),
    ("/api/shipping/quote", _calc_view(False, "weight", "shipping"), False, "Estimate shipping", "weight"),
    ("/api/account/statement", _calc_view(True, "month", "statement"), True, "Generate an account statement", "month"),
    ("/api/orders/track", _track_view(False), False, "Track an order", "order"),
    ("/api/account/invoices", _track_view(True), True, "Fetch an invoice", "id"),
]
for _path, _view, _ra, _summary, _fname in _RESOURCES:
    app.add_url_rule(_path, endpoint="res_" + _path.strip("/").replace("/", "_"),
                     view_func=_view, methods=_METHODS)


_FIELD_EXAMPLE = {"code": "SAVE10", "status": "Mug", "message": "Hi {{ customer }}!",
                  "signature": "Thanks, {{ customer }}", "weight": "2", "month": "3",
                  "order": "1001", "id": "1001"}
_VERB_DESC = {"GET": "Fetch", "POST": "Create", "PUT": "Update", "DELETE": "Remove"}


def _resource_paths() -> dict:
    paths = {}
    for path, _view, requires_auth, summary, field in _RESOURCES:
        example = _FIELD_EXAMPLE.get(field, "value")
        ops = {}
        for method in _METHODS:
            op = {
                "tags": ["Authenticated" if requires_auth else "store"],
                "summary": f"{summary} ({method})",
                "description": f"{_VERB_DESC[method]} via the `{field}` value, supplied as a query "
                               f"parameter or in the JSON body. Returns a JSON result.",
                "parameters": [{"name": field, "in": "query", "description": f"the {field} value",
                                "schema": {"type": "string"}, "example": example}],
                "responses": {"200": {"description": "Success.",
                                      "content": {"application/json": {"schema": {"type": "object"}}}}},
            }
            if method in ("POST", "PUT"):
                op["requestBody"] = {"content": {"application/json": {"schema": {"type": "object",
                    "properties": {field: {"type": "string", "example": example}}}}}}
            if requires_auth:
                op["security"] = [{"bearerAuth": []}]
                op["responses"]["401"] = {"$ref": "#/components/responses/Unauthorized"}
            ops[method.lower()] = op
        paths[path] = ops
    return paths


# ============================ hidden XHR endpoints ==========================
# Referenced only in /static/js/app.js (window.BOXCUTTER.internal) and never
# called by the running app - you find them by reading the bundle.

@app.route("/api/internal/user-lookup")
def internal_user_lookup():
    email = request.args.get("email", "")
    conn = get_conn()
    try:
        # VULN[hidden-sqli]: email concatenated into the query.
        sql = f"SELECT id, username, email, role FROM users WHERE email = '{email}'"
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
        conn.close()
        return jsonify({"users": rows})
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e), "query": sql}), 500


@app.route("/api/internal/debug-report")
def internal_debug_report():
    rid = request.args.get("id", "")
    try:
        return jsonify({"report_id": int(rid), "status": "ready"})
    except ValueError as e:
        # VULN[hidden-error]: verbose error leaks config + stack trace.
        return jsonify({"error": str(e), "trace": traceback.format_exc(), "config": {
            "jwt_secret": JWT_SECRET, "db": DB_PATH, "flag": "FLAG{hidden-xhr-error-leak}"}}), 500


@app.route("/api/internal/fetch")
def internal_fetch():
    import urllib.request
    url = request.args.get("url", "")
    # VULN[ssrf]: the server fetches an arbitrary URL (e.g. http://169.254.169.254/).
    if "169.254.169.254" in url or "metadata.google" in url:
        # cloud metadata is reachable from the server -> fake IAM creds (impactful SSRF).
        return jsonify({"AccessKeyId": "ASIAEXAMPLEKEYID", "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/EXAMPLEKEY",
                        "Token": "FwoGZXIvYXdz...", "Expiration": "2026-01-01T00:00:00Z"})
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:  # noqa: S310
            return Response(resp.read()[:4000], mimetype="text/plain")
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e), "requested": url}), 502


# ============================ access-control variants =======================

@app.route("/api/admin/console")
def admin_console():
    # VULN[jwt-alg-none]: token is decoded WITHOUT verifying the signature, so a
    # forged unsigned (alg=none) token with role=admin is accepted.
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError:
        return jsonify({"error": "invalid token"}), 401
    if claims.get("role") != "admin":
        return jsonify({"error": "forbidden"}), 403
    return jsonify({"console": "enabled", "flag": "FLAG{jwt-alg-none-accepted}"})


@app.route("/api/admin/metrics")
def admin_metrics():
    # VULN[ip-trust]: "internal only" access decided by a spoofable header.
    client = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    if client not in ("127.0.0.1", "10.0.0.1"):
        return jsonify({"error": "internal network only"}), 403
    return jsonify({"orders_today": 142, "revenue": 18230.5, "flag": "FLAG{x-forwarded-for-trust}"})


@app.route("/exports/<path:name>")
def exports(name):
    # VULN[predictable-idor]: predictable, unauthenticated data exports.
    canned = {
        "users-2024-q1.json": [{"id": 1, "username": "admin", "email": "admin@boxcutter.test", "role": "admin"},
                               {"id": 2, "username": "alice", "email": "alice@example.com", "role": "user"}],
        "orders-2024-q1.json": [{"id": 1001, "user": "alice", "total": 59.0, "card_last4": "4242"}],
    }
    return (jsonify(canned[name]) if name in canned else (jsonify({"error": "not found"}), 404))


@app.route("/api/account/profile-by-id")
def profile_by_id():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[param-access]: authenticated, but a user_id parameter selects WHOSE profile
    # is returned (horizontal access) - pass any id.
    uid = request.args.get("user_id", "")
    conn = get_conn()
    row = conn.execute("SELECT id, username, email, role, api_token FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"error": "not found"})


@app.route("/api/orders/<int:oid>/notes", methods=["GET", "POST"])
def order_notes(oid):
    # VULN[method-access]: GET is authenticated, POST is not (broken method-based AC) -
    # anyone can write a note to any order.
    if request.method == "GET":
        _claims, err = _require_jwt()
        if err:
            return err
        return jsonify({"order": oid, "notes": ["packed", "left warehouse"]})
    note = (request.get_json(silent=True) or {}).get("note", "")
    return jsonify({"order": oid, "saved": note, "by": "anonymous"})


# ============================ XSS contexts ==================================

@app.route("/profile-card")
def xss_attribute():
    name = request.args.get("name", "guest")
    # VULN[xss-attr]: reflected inside a double-quoted HTML attribute ("><svg ...).
    return page("Profile card", f'<label class="label">Display name</label>'
                                f'<input class="input" value="{name}">')


@app.route("/track-page")
def xss_js():
    ref = request.args.get("ref", "home")
    # VULN[xss-js]: reflected inside a single-quoted JS string ('-alert(1)-').
    return page("Tracking", f"<p>Loading tracking...</p>"
                            f"<script>var ref = '{ref}'; console.log('referrer', ref);</script>")


@app.route("/go")
def xss_href():
    url = request.args.get("url", "/")
    # VULN[xss-href]: reflected into an href (javascript: URI / attribute breakout).
    return page("Redirect", f'<p>Taking you back...</p><a class="button is-info" href="{url}">Continue</a>')


# ============================ business-logic flaws ==========================

@app.route("/api/checkout", methods=["POST"])
def checkout():
    data = request.get_json(silent=True) or {}
    # VULN[bl-price]: the amount charged is taken from the client (set total=0.01).
    total = data.get("total", data.get("price", 0))
    return jsonify({"order_id": 9001, "status": "paid", "charged": total})


@app.route("/api/cart/add", methods=["POST"])
def cart_add():
    data = request.get_json(silent=True) or {}
    # VULN[bl-negative]: negative quantity produces a negative (credit) line total.
    try:
        qty = int(data.get("qty", 1))
    except (TypeError, ValueError):
        qty = 1
    return jsonify({"item": data.get("item", "Cumulus Hoodie"), "qty": qty, "line_total": round(qty * 59.0, 2)})


@app.route("/api/checkout/apply-coupon", methods=["POST"])
def apply_coupon():
    data = request.get_json(silent=True) or {}
    # VULN[bl-coupon]: discount percent is uncapped (>100% pays the customer).
    try:
        pct = float(data.get("percent", 0))
    except (TypeError, ValueError):
        pct = 0
    subtotal = 100.0
    return jsonify({"subtotal": subtotal, "discount_pct": pct, "total": round(subtotal * (1 - pct / 100), 2)})


@app.route("/api/orders/<int:oid>/status", methods=["POST"])
def order_status(oid):
    data = request.get_json(silent=True) or {}
    # VULN[bl-status]: any caller can set the order status (mark shipped/refunded
    # without paying) - no state-machine or ownership check.
    return jsonify({"order": oid, "status": data.get("status", "shipped"), "updated": True})


# ============================ more vulnerable functionality ==================

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
_UPLOAD_CT: dict[str, str] = {}


@app.route("/api/orders/import", methods=["POST"])
def orders_import():
    xml = request.get_data(as_text=True) or ""
    # VULN[xxe]: external entities are resolved - a SYSTEM entity reads a local file
    # (file://) or fetches a URL (http://) and its content is reflected back.
    out = xml
    for name, _kind, ref in re.findall(r'<!ENTITY\s+(\w+)\s+(SYSTEM|PUBLIC)\s+"([^"]+)"', xml):
        try:
            if ref.startswith("file://"):
                with open(ref[7:], "r", errors="replace") as fh:
                    data = fh.read()[:4000]
            elif ref.startswith(("http://", "https://")):
                import urllib.request
                with urllib.request.urlopen(ref, timeout=5) as r:  # noqa: S310
                    data = r.read()[:2000].decode("utf-8", "replace")
            else:
                data = ""
        except Exception as e:  # noqa: BLE001
            data = f"[entity error: {e}]"
        out = out.replace(f"&{name};", data)
    parsed = re.sub(r"<!DOCTYPE[^>]*>", "", out, flags=re.S).strip()
    return Response(f"<imported>{parsed}</imported>", mimetype="application/xml")


@app.route("/api/preferences")
def preferences():
    # VULN[deserialization]: 'prefs' cookie/param is base64 pickle, loaded with no
    # validation -> RCE via a crafted pickle (__reduce__).
    raw = request.cookies.get("prefs") or request.args.get("prefs", "")
    if not raw:
        return jsonify({"theme": "light", "currency": "USD"})
    try:
        data = pickle.loads(base64.b64decode(raw))  # noqa: S301
        return jsonify({"prefs": str(data)})
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400


@app.route("/api/avatar", methods=["POST"])
def avatar_upload():
    # VULN[file-upload]: no validation of file name or content type; the file is served
    # back from /uploads/<name> with the supplied content type -> stored XSS (upload
    # text/html or image/svg+xml), source disclosure, etc.
    f = request.files.get("file")
    if f is not None:
        name, content, ctype = os.path.basename(f.filename or "upload.bin"), f.read(), (f.mimetype or "application/octet-stream")
    else:
        d = request.get_json(silent=True) or {}
        name = os.path.basename(d.get("name", "avatar.html"))
        content, ctype = str(d.get("content", "")).encode("utf-8", "replace"), d.get("content_type", "text/html")
    with open(os.path.join(UPLOAD_DIR, name), "wb") as fh:
        fh.write(content)
    _UPLOAD_CT[name] = ctype
    return jsonify({"stored": name, "url": f"/uploads/{name}", "content_type": ctype})


@app.route("/uploads/<path:name>")
def uploads(name):
    safe = os.path.basename(name)
    path = os.path.join(UPLOAD_DIR, safe)
    if not os.path.exists(path):
        return jsonify({"error": "not found"}), 404
    with open(path, "rb") as fh:
        return Response(fh.read(), mimetype=_UPLOAD_CT.get(safe, "application/octet-stream"))


@app.route("/api/account/data")
def account_data():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[cors]: reflects Origin + allows credentials -> any site reads this cross-origin.
    resp = jsonify({"username": claims.get("sub"), "role": claims.get("role"),
                    "api_token": "tok_" + (claims.get("sub") or "x")})
    resp.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    return resp


@app.route("/api/password/reset", methods=["POST"])
def password_reset():
    email = (request.get_json(silent=True) or {}).get("email", "")
    # VULN[host-header]: the reset link is built from the Host header (reset/cache
    # poisoning) - set Host: evil.example and the victim gets a link to evil.
    return jsonify({"sent": True, "reset_link": f"{request.host_url}reset?email={email}&token=abc123"})


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    email = (request.get_json(silent=True) or {}).get("email", "")
    conn = get_conn()
    exists = conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    # VULN[user-enum]: the response reveals whether the account exists.
    if exists:
        return jsonify({"message": "A password reset email has been sent."})
    return jsonify({"message": "No account exists with that email."}), 404


@app.route("/api/account/email", methods=["GET", "POST"])
def change_email():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[csrf]: state-changing action accepted over GET with no CSRF token / re-auth.
    new = request.values.get("email", "")
    if new:
        conn = get_conn()
        conn.execute("UPDATE users SET email = ? WHERE username = ?", (new, claims.get("sub")))
        conn.commit()
        conn.close()
        return jsonify({"updated": True, "email": new})
    return jsonify({"email": "unchanged"})


@app.route("/api/export.csv")
def export_csv():
    conn = get_conn()
    rows = conn.execute("SELECT username, email, full_name FROM users").fetchall()
    conn.close()
    # VULN[csv-injection]: user-controlled fields (full_name from /api/profile) written
    # into CSV without neutralising a leading = + - @ -> spreadsheet formula injection.
    lines = ["username,email,full_name"] + [f'{r["username"]},{r["email"]},{r["full_name"]}' for r in rows]
    return Response("\n".join(lines) + "\n", mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=customers.csv"})


@app.route("/api/directory")
def directory():
    name = request.args.get("user", "")
    conn = get_conn()
    everyone = [dict(r) for r in conn.execute("SELECT username, email, role FROM users").fetchall()]
    conn.close()
    # VULN[ldap-injection]: wildcard / filter metacharacters bypass the lookup and
    # return every entry (unescaped LDAP search filter).
    if not name or any(c in name for c in "*()|&"):
        return jsonify({"filter": f"(uid={name})", "results": everyone})
    return jsonify({"filter": f"(uid={name})", "results": [u for u in everyone if u["username"] == name]})


@app.route("/api/staff")
def staff_lookup():
    name = request.args.get("name", "")
    staff = [{"name": "admin", "dept": "IT", "ext": "1001"}, {"name": "alice", "dept": "Sales", "ext": "1002"}]
    # VULN[xpath-injection]: quote / boolean metacharacters bypass the filter (unescaped
    # XPath //staff[name='<name>']).
    if not name or "'" in name or " or " in name.lower():
        return jsonify({"query": f"//staff[name='{name}']", "results": staff})
    return jsonify({"query": f"//staff[name='{name}']", "results": [s for s in staff if s["name"] == name]})


# ============================ broken access control / IDOR ===================

@app.route("/api/orders/<int:oid>/invoice")
def order_invoice(oid):
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    row = conn.execute("SELECT id, item, total, address, card_last4 FROM orders WHERE id = ?", (oid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "not found"}), 404
    # VULN[idor-invoice]: any order's invoice (incl. address + card) - no ownership check.
    return Response(f"INVOICE #{row['id']}\nItem: {row['item']}\nTotal: ${row['total']}\n"
                    f"Ship to: {row['address']}\nCard: ****{row['card_last4']}\n", mimetype="text/plain")


@app.route("/api/users/<int:uid>/orders")
def user_orders(uid):
    conn = get_conn()
    rows = [dict(r) for r in conn.execute("SELECT id, item, total FROM orders WHERE user_id = ?", (uid,)).fetchall()]
    conn.close()
    # VULN[idor-orders]: anyone can list ANY user's order history (no auth, no ownership).
    return jsonify({"user_id": uid, "orders": rows})


@app.route("/api/account/addresses/<int:aid>", methods=["GET", "PUT"])
def address(aid):
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    if request.method == "PUT":
        conn.execute("UPDATE orders SET address = ? WHERE id = ?",
                     ((request.get_json(silent=True) or {}).get("address", ""), aid))
        conn.commit()
    row = conn.execute("SELECT id, user_id, address FROM orders WHERE id = ?", (aid,)).fetchone()
    conn.close()
    # VULN[idor-address]: read / EDIT any user's shipping address by id (no ownership).
    return jsonify(dict(row) if row else {"error": "not found"})


@app.route("/api/admin/refund", methods=["POST"])
def admin_refund():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    # VULN[bfla-refund]: issuing a refund is an admin action, but there is NO role check -
    # any signed-in user can refund any order (broken function-level authorization).
    return jsonify({"refunded_order": d.get("order_id"), "amount": d.get("amount"),
                    "by": claims.get("sub"), "ok": True})


@app.route("/api/admin/delete-user", methods=["GET", "POST"])
def admin_delete_user():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[bfla-delete]: deleting a user is admin-only, but there is no role check and it
    # is even accepted over GET - any signed-in user can invoke it.
    return jsonify({"deleted_user": request.values.get("id", ""), "by": claims.get("sub"), "ok": True})


@app.route("/api/admin/products/<int:pid>/price", methods=["PUT", "POST"])
def admin_set_price(pid):
    claims, err = _require_jwt()
    if err:
        return err
    price = (request.get_json(silent=True) or {}).get("price")
    # VULN[bfla-price]: changing a product price is admin-only, but there is no role check.
    conn = get_conn()
    conn.execute("UPDATE products SET price = ? WHERE id = ?", (price, pid))
    conn.commit()
    conn.close()
    return jsonify({"product": pid, "price": price, "by": claims.get("sub")})


@app.route("/api/coupons/generate", methods=["POST"])
def coupons_generate():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    # VULN[bfla-coupon]: minting discount coupons is an admin action, but any signed-in
    # user can do it (no role check).
    return jsonify({"code": d.get("code", "FREE100"), "percent": d.get("percent", 100),
                    "created_by": claims.get("sub")})


# ============================ API versions (old = vulnerable) ================
# The same resource at v1/v2/v3. Only the newest version is secure; the older
# versions are still exposed and still vulnerable - the classic "nobody retired
# the old API" problem.

@app.route("/api/v3/users/<int:uid>")
def users_v3(uid):
    # SECURE (current): requires a token and you can only read your OWN record.
    claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    me = conn.execute("SELECT id FROM users WHERE username = ?", (claims.get("sub"),)).fetchone()
    if not me or me["id"] != uid:
        conn.close()
        return jsonify({"error": "forbidden"}), 403
    row = conn.execute("SELECT id, username, email, role FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"error": "not found"})


@app.route("/api/v2/users/<int:uid>")
def users_v2(uid):
    # VULN[ver-idor]: deprecated - requires a token but ANY id works (no ownership).
    _claims, err = _require_jwt()
    if err:
        return err
    conn = get_conn()
    row = conn.execute("SELECT id, username, email, role, api_token FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()
    return jsonify(dict(row) if row else {"error": "not found"})


@app.route("/api/v1/users/<uid>")
def users_v1(uid):
    # VULN[ver-sqli]: legacy - no auth at all, id concatenated -> SQLi + full dump.
    conn = get_conn()
    try:
        sql = f"SELECT id, username, email, role, api_token FROM users WHERE id = {uid}"
        rows = [dict(r) for r in conn.execute(sql).fetchall()]
        conn.close()
        return jsonify({"users": rows})
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e), "query": sql}), 500


# ============================ registration / login (enumerable) ==============

@app.route("/api/register", methods=["POST"])
def register():
    d = request.get_json(silent=True) or {}
    username = (d.get("username") or "").strip()
    if not username:
        return jsonify({"error": "username required"}), 400
    conn = get_conn()
    exists = conn.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone()
    if exists:
        conn.close()
        # VULN[reg-user-enum]: registration reveals that a username is already taken.
        return jsonify({"error": f"username '{username}' is already taken"}), 409
    conn.execute("INSERT INTO users (username, password, email, role, full_name, api_token, bio) "
                 "VALUES (?,?,?,?,?,?,?)",
                 (username, d.get("password", "changeme"), d.get("email", ""), "user",
                  d.get("full_name", username), "tok_" + username, ""))
    conn.commit()
    conn.close()
    return jsonify({"registered": username, "token": _issue_token(username, "user")})


@app.route("/api/v1/login", methods=["POST"])
def login_v1():
    d = request.get_json(silent=True) or {}
    conn = get_conn()
    row = conn.execute("SELECT password FROM users WHERE username = ?", (d.get("username"),)).fetchone()
    conn.close()
    # VULN[login-user-enum]: distinct messages for unknown user vs wrong password.
    if row is None:
        return jsonify({"error": "no such user"}), 404
    if row["password"] != d.get("password"):
        return jsonify({"error": "incorrect password"}), 401
    return jsonify({"token": _issue_token(d.get("username"), "user")})


# ============================ checkout / vouchers / payments =================

VOUCHERS = {"WELCOME10": 10, "VIP25": 25, "FRIEND5": 5, "INVITE2024": 0}
_TEST_CARDS = {"4242424242424242", "4111111111111111", "5555555555554444"}


@app.route("/api/vouchers/redeem", methods=["POST"])
def voucher_redeem():
    code = (request.get_json(silent=True) or {}).get("code", "")
    if code in VOUCHERS:
        return jsonify({"valid": True, "code": code, "discount_pct": VOUCHERS[code]})
    return jsonify({"valid": False, "code": code, "discount_pct": 0})


@app.route("/api/orders", methods=["POST"])
def place_order():
    d = request.get_json(silent=True) or {}
    item = d.get("item", "Cumulus Hoodie")
    qty = int(d.get("qty", 1) or 1)
    discount = VOUCHERS.get(d.get("voucher", ""), 0)
    total = round(qty * 59.0 * (1 - discount / 100), 2)
    conn = get_conn()
    # Persisted to the orders table (status 'unpaid' until paid).
    cur = conn.execute("INSERT INTO orders (user_id, item, total, address, card_last4, status) "
                       "VALUES (?,?,?,?,?,?)", (0, item, total, "", "", "unpaid"))
    oid = cur.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"order_id": oid, "item": item, "qty": qty, "total": total,
                    "voucher_discount_pct": discount, "status": "unpaid"})


@app.route("/api/payments/charge", methods=["POST"])
def pay_order():
    d = request.get_json(silent=True) or {}
    oid = int(d.get("order_id", 0) or 0)
    card = str(d.get("card", "")).replace(" ", "")
    conn = get_conn()
    order = conn.execute("SELECT id, total FROM orders WHERE id = ?", (oid,)).fetchone()
    if not order:
        conn.close()
        return jsonify({"error": "unknown order"}), 404
    if card not in _TEST_CARDS:
        conn.close()
        return jsonify({"error": "card declined"}), 402
    code = "CONF-" + os.urandom(4).hex().upper()
    conn.execute("UPDATE orders SET status='paid', code=? WHERE id=?", (code, oid))
    conn.commit()
    conn.close()
    return jsonify({"order_id": oid, "status": "paid", "amount": order["total"], "confirmation_code": code})


@app.route("/api/orders/confirm", methods=["POST"])
def confirm_order():
    d = request.get_json(silent=True) or {}
    oid = int(d.get("order_id", 0) or 0)
    code = str(d.get("confirmation_code", ""))
    conn = get_conn()
    order = conn.execute("SELECT id FROM orders WHERE id = ?", (oid,)).fetchone()
    if not order:
        conn.close()
        return jsonify({"error": "unknown order"}), 404
    # VULN[payment-confirmation]: the code is validated GLOBALLY (any order's code is
    # accepted) instead of being bound to THIS order's payment - so a code from paying
    # your own order confirms/fulfils anyone else's unpaid order for free.
    valid = conn.execute("SELECT 1 FROM orders WHERE code = ? AND code IS NOT NULL", (code,)).fetchone()
    if valid:
        conn.execute("UPDATE orders SET status='fulfilled' WHERE id=?", (oid,))
        conn.commit()
        conn.close()
        return jsonify({"order_id": oid, "status": "fulfilled"})
    conn.close()
    return jsonify({"error": "invalid confirmation code"}), 400


@app.route("/api/orders/<int:oid>/state")
def order_state(oid):
    conn = get_conn()
    row = conn.execute("SELECT id, item, total, status, code FROM orders WHERE id = ?", (oid,)).fetchone()
    conn.close()
    return jsonify(dict(row)) if row else (jsonify({"error": "unknown order"}), 404)


_EXTRA = [
    # (path, methods, auth, tag, summary, query-param)
    ("/api/register", ["POST"], False, "public", "Register a new account", None),
    ("/api/v1/login", ["POST"], False, "public", "Sign in (v1, legacy)", None),
    ("/api/v1/users/{id}", ["GET"], False, "public", "Get a user (v1, legacy)", None),
    ("/api/v2/users/{id}", ["GET"], True, "Authenticated", "Get a user (v2, deprecated)", None),
    ("/api/v3/users/{id}", ["GET"], True, "Authenticated", "Get a user (v3, current)", None),
    ("/api/vouchers/redeem", ["POST"], False, "store", "Redeem a voucher / invite code", None),
    ("/api/orders", ["POST"], False, "store", "Place an order", None),
    ("/api/payments/charge", ["POST"], False, "store", "Pay for an order (test card)", None),
    ("/api/orders/confirm", ["POST"], False, "store", "Confirm an order with its code", None),
    ("/api/orders/{id}/state", ["GET"], False, "store", "Get order state", None),
    ("/api/orders/import", ["POST"], False, "store", "Import orders from an XML feed", None),
    ("/api/preferences", ["GET"], False, "store", "Get saved preferences", None),
    ("/api/avatar", ["POST"], False, "store", "Upload a profile avatar", None),
    ("/api/account/data", ["GET"], True, "Authenticated", "Export my account data", None),
    ("/api/password/reset", ["POST"], False, "public", "Send a password reset link", None),
    ("/api/forgot-password", ["POST"], False, "public", "Check if an account exists", None),
    ("/api/account/email", ["GET", "POST"], True, "Authenticated", "Change my email address", "email"),
    ("/api/profile/update", ["POST", "PUT"], True, "Authenticated", "Update a user's profile by id", None),
    ("/api/validate", ["GET"], False, "public", "Validate an email address", "email"),
    ("/api/contact", ["POST"], False, "public", "Send a contact message", None),
    ("/api/webhooks", ["POST"], False, "store", "Register a webhook", None),
    ("/api/webhooks/{id}/test", ["POST"], False, "store", "Test a webhook (fires a request)", None),
    ("/api/invoice/render", ["POST"], False, "store", "Render an invoice (HTML/PDF)", None),
    ("/api/i18n", ["GET"], False, "public", "Localised UI strings", "lang"),
    ("/api/cart/{id}", ["GET"], False, "store", "Get a shared cart", None),
    ("/api/messages", ["POST"], True, "Authenticated", "Send a message to another user", None),
    ("/api/messages/{id}", ["GET"], True, "Authenticated", "Read a message", None),
    ("/api/keys", ["POST"], True, "Authenticated", "Generate an API key", None),
    ("/api/remember", ["POST"], True, "Authenticated", "Enable remember-me", None),
    ("/api/admin/reports", ["GET"], True, "Authenticated", "Sales reports", None),
    ("/api/export.csv", ["GET"], False, "store", "Export customers as CSV", None),
    ("/api/directory", ["GET"], False, "store", "Staff directory lookup", "user"),
    ("/api/staff", ["GET"], False, "store", "Staff lookup", "name"),
    ("/api/orders/{id}/invoice", ["GET"], True, "Authenticated", "Download an order invoice", None),
    ("/api/users/{id}/orders", ["GET"], False, "store", "List a user's orders", None),
    ("/api/account/addresses/{id}", ["GET", "PUT"], True, "Authenticated", "Get or update a saved address", None),
    ("/api/admin/refund", ["POST"], True, "Authenticated", "Issue a refund", None),
    ("/api/admin/delete-user", ["GET", "POST"], True, "Authenticated", "Delete a user", "id"),
    ("/api/admin/products/{id}/price", ["PUT", "POST"], True, "Authenticated", "Set a product price", None),
    ("/api/coupons/generate", ["POST"], True, "Authenticated", "Generate a discount coupon", None),
    ("/api/account/reports", ["GET"], True, "Authenticated", "Marketing & revenue reports", "company_id"),
    ("/api/menu/items/update", ["POST"], True, "Authenticated", "Update a menu item", None),
    ("/api/config/client", ["GET"], False, "public", "Client runtime config", None),
    ("/api/account/recover", ["POST"], False, "public", "Recover an account", None),
    ("/api/account/reset-link", ["POST"], False, "public", "Send a password reset link", None),
    ("/api/cart/price", ["POST"], False, "store", "Price a cart (base + modifiers)", None),
    ("/api/campaigns/boost", ["POST"], True, "Authenticated", "Enable Premium Boost on a campaign", None),
]


def _extra_paths() -> dict:
    paths = {}
    for path, methods, auth, tag, summary, qp in _EXTRA:
        pps = re.findall(r"\{(\w+)\}", path)
        ops = {}
        for m in methods:
            params = [{"name": p, "in": "path", "required": True,
                       "schema": {"type": "integer" if p == "id" else "string"}} for p in pps]
            if qp:
                params.append({"name": qp, "in": "query", "schema": {"type": "string"}})
            op = {"tags": [tag], "summary": summary, "responses": {"200": {"description": "ok"}}}
            if params:
                op["parameters"] = params
            if m in ("POST", "PUT"):
                op["requestBody"] = {"content": {"application/json": {"schema": {"type": "object"}}}}
            if auth:
                op["security"] = [{"bearerAuth": []}]
                op["responses"]["401"] = {"$ref": "#/components/responses/Unauthorized"}
            ops[m.lower()] = op
        paths[path] = ops
    return paths


# ============================ more vulnerable functionality (round 2) ========

import urllib.request as _urllib

KEYS_DIR = os.path.join(os.path.dirname(__file__), "keys")
LOCALES_DIR = os.path.join(os.path.dirname(__file__), "locales")
os.makedirs(KEYS_DIR, exist_ok=True)
os.makedirs(LOCALES_DIR, exist_ok=True)
if not os.path.exists(os.path.join(KEYS_DIR, "main")):
    with open(os.path.join(KEYS_DIR, "main"), "w", encoding="utf-8") as _fh:
        _fh.write(JWT_SECRET)
for _lang, _body in {"en": '{"hello":"Hello","cart":"Cart"}', "es": '{"hello":"Hola","cart":"Carro"}'}.items():
    _lp = os.path.join(LOCALES_DIR, _lang)
    if not os.path.exists(_lp):
        with open(_lp, "w", encoding="utf-8") as _fh:
            _fh.write(_body)

_WEBHOOKS: dict[int, str] = {}
_MESSAGES: dict[int, dict] = {}


@app.route("/api/validate")
def validate_email():
    email = request.args.get("email", "")
    # VULN[redos]: catastrophic backtracking on a long non-matching input.
    ok = bool(re.match(r"^([a-zA-Z0-9]+)+@example\.com$", email))
    return jsonify({"email": email, "valid": ok})


@app.route("/api/contact", methods=["POST"])
def api_contact():
    d = request.get_json(silent=True) or {}
    name = d.get("name", "")
    # VULN[email-header-injection]: name flows into mail headers unsanitised - a newline
    # injects extra headers (Bcc:, etc.).
    headers = f"From: {name} <noreply@boxcutter.test>\nTo: support@boxcutter.test\nSubject: Message from {name}"
    return jsonify({"queued": True, "raw_headers": headers})


@app.route("/api/webhooks", methods=["POST"])
def webhook_register():
    d = request.get_json(silent=True) or {}
    wid = len(_WEBHOOKS) + 1
    _WEBHOOKS[wid] = d.get("url", "")
    # signing secret leaked in the registration response
    return jsonify({"id": wid, "url": _WEBHOOKS[wid], "signing_secret": "whsec_3f9c1aa1bb22cc33dd"})


@app.route("/api/webhooks/<int:wid>/test", methods=["POST"])
def webhook_test(wid):
    url = _WEBHOOKS.get(wid)
    if not url:
        return jsonify({"error": "unknown webhook"}), 404
    # VULN[ssrf-webhook]: the server fetches the registered URL (blind SSRF to internal services).
    try:
        with _urllib.urlopen(url, timeout=5) as r:  # noqa: S310
            return jsonify({"status": getattr(r, "status", 200), "body": r.read()[:600].decode("utf-8", "replace")})
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 502


@app.route("/latest/meta-data/iam/security-credentials/")
def meta_iam_list():
    return Response("store-app-role\n", mimetype="text/plain")


@app.route("/latest/meta-data/iam/security-credentials/<role>")
def meta_iam(role):
    # VULN[cloud-metadata]: mock instance-metadata creds, reachable via the SSRF endpoints.
    return jsonify({"Code": "Success", "AccessKeyId": "ASIAEXAMPLEKEYID", "Type": "AWS-HMAC",
                    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/EXAMPLEKEY", "Token": "FwoGZXIvYXdz...",
                    "Expiration": "2026-01-01T00:00:00Z"})


@app.route("/api/invoice/render", methods=["POST"])
def invoice_render():
    d = request.get_json(silent=True) or {}
    template = d.get("template", "<h1>Invoice for {{ customer }} — {{ store }}</h1>")
    # VULN[ssti-pdf]: the invoice template is rendered with Jinja (SSTI: {{7*7}}); the
    # naive HTML-to-PDF step then fetches any src/href it contains (SSRF + file:// LFI).
    try:
        html = render_template_string(template, customer=d.get("customer", "Customer"), store="Boxcutter Store")
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 400
    embedded = []
    for src in re.findall(r'(?:src|href)\s*=\s*"([^"]+)"', html):
        try:
            if src.startswith("file://"):
                with open(src[7:], "r", errors="replace") as fh:
                    embedded.append({src: fh.read()[:500]})
            elif src.startswith(("http://", "https://")):
                with _urllib.urlopen(src, timeout=4) as r:  # noqa: S310
                    embedded.append({src: r.read()[:300].decode("utf-8", "replace")})
        except Exception as e:  # noqa: BLE001
            embedded.append({src: f"[error: {e}]"})
    return jsonify({"format": "pdf", "rendered_html": html, "embedded_resources": embedded})


@app.route("/api/admin/reports")
def admin_reports():
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    try:
        kid = (jwt.get_unverified_header(token) or {}).get("kid", "main")
        # VULN[jwt-kid]: kid is a filesystem path to the HMAC key, so traversal lets you
        # point it at a file whose contents you control (e.g. an uploaded file) and forge.
        with open(os.path.join(KEYS_DIR, kid), "r", errors="replace") as fh:
            key = fh.read().strip()
        claims = jwt.decode(token, key, algorithms=["HS256"])
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 401
    return jsonify({"role": claims.get("role"), "reports": ["sales-q1", "sales-q2"]})


@app.route("/admin/logs")
def admin_logs():
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    rows = []
    try:
        with open(os.path.join(LOG_DIR, f"requests-{day}.log"), encoding="utf-8") as fh:
            for line in fh.readlines()[-50:]:
                try:
                    e = json.loads(line)
                except ValueError:
                    continue
                # VULN[log-xss]: logged path / User-Agent rendered as raw HTML (log injection -> stored XSS).
                rows.append(f"<tr><td>{e.get('ts')}</td><td>{e.get('method')}</td>"
                            f"<td>{e.get('path')}</td><td>{e.get('ua')}</td></tr>")
    except OSError:
        pass
    return page("Request log", "<h1 class='title'>Recent requests</h1>"
                "<table class='table is-fullwidth'><thead><tr><th>Time</th><th>Method</th>"
                f"<th>Path</th><th>User-Agent</th></tr></thead><tbody>{''.join(rows)}</tbody></table>")


@app.route("/api/i18n")
def i18n():
    lang = request.args.get("lang", "en")
    # VULN[lfi-lang]: lang builds a file path with no sanitisation -> ?lang=../app.py.
    try:
        with open(os.path.join(LOCALES_DIR, lang), "r", errors="replace") as fh:
            return Response(fh.read(), mimetype="application/json")
    except OSError as e:
        return jsonify({"error": str(e)}), 404


@app.route("/api/cart/<int:cid>")
def get_cart(cid):
    # VULN[idor-cart]: any shareable cart by id, no auth / ownership.
    return jsonify({"cart_id": cid, "owner_user_id": cid,
                    "items": [{"item": "Cumulus Hoodie", "qty": 1, "price": 59.0}]})


@app.route("/api/messages", methods=["POST"])
def post_message():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    mid = len(_MESSAGES) + 1
    _MESSAGES[mid] = {"id": mid, "from": claims.get("sub"), "to": d.get("to"), "body": d.get("body", "")}
    return jsonify(_MESSAGES[mid])


@app.route("/api/messages/<int:mid>")
def get_message(mid):
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[idor-message]: any message by id, no recipient check (body stored as-is -> XSS when shown).
    m = _MESSAGES.get(mid)
    return jsonify(m) if m else (jsonify({"error": "not found"}), 404)


@app.route("/api/keys", methods=["POST"])
def generate_api_key():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[predictable-key]: the API key is derived from the username, not random.
    return jsonify({"api_key": "bsk_live_" + (claims.get("sub") or "x") + "_2024"})


@app.route("/account/close")
def account_close_page():
    # VULN[clickjacking]: sensitive action page with no X-Frame-Options / CSP frame-ancestors.
    return page("Close account", "<h1 class='title'>Close your account</h1>"
                "<p>This permanently deletes your account and orders.</p>"
                "<button class='button is-danger'>Permanently close account</button>")


@app.route("/api/remember", methods=["POST"])
def remember_me():
    claims, err = _require_jwt()
    if err:
        return err
    resp = jsonify({"remembered": True})
    # VULN[cookie-flags]: forgeable token in a cookie with no HttpOnly / Secure / SameSite.
    resp.set_cookie("remember", base64.b64encode((claims.get("sub", "") + ":1").encode()).decode())
    return resp


# ============================ more vulnerable functionality (round 3) ========

# Two tenants ("companies"), each owning private revenue / marketing data. The
# caller's token never says which company they belong to - the org is chosen by a
# client-supplied id, so there is nothing tying a caller to a single tenant.
_ORG_REPORTS = {
    "165690": {"company": "Alder & Co", "currency": "GBP", "revenue": 53485, "roas": 31.5,
               "campaigns": [{"id": "68c7a791", "area": "ha8", "spend": 750, "revenue": 7881}]},
    "122123": {"company": "Birch Bistro", "currency": "GBP", "revenue": 18820, "roas": 5.9,
               "campaigns": [{"id": "1dea6b4e", "area": "ha7", "spend": 400, "revenue": 2363}]},
}


@app.route("/api/account/reports")
def account_reports():
    claims, err = _require_jwt()
    if err:
        return err
    # VULN[tenant-isolation]: the org whose data is returned is taken from a
    # client-supplied tenant id (X-Company-Id header or ?company_id=) with NO check
    # that the authenticated caller belongs to that org -> horizontal cross-tenant
    # data access (mirrors the x-company-identifier / companyIdentifier findings).
    org = request.headers.get("X-Company-Id") or request.args.get("company_id") or "165690"
    report = _ORG_REPORTS.get(str(org))
    if not report:
        return jsonify({"error": "unknown company", "company_id": org}), 404
    return jsonify({"company_id": org, "viewer": claims.get("sub"), **report})


# Menu items keyed by (restaurant_id, uuid). A signed-in restaurant may edit only
# its OWN items - but the routing trusts a client-supplied `where` value.
_MENU_ITEMS = {
    ("9492893", "self-uuid"): {"name": "Zupa serowa", "price": 2200},
    ("9627043", "54a23c86-86ed-474a-a2f4-172dfb19685e"): {"name": "Pizza Margherita", "price": 3900},
}


@app.route("/api/menu/items/update", methods=["POST"])
def menu_item_update():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    where = str(d.get("where", "self/items/self-uuid"))
    try:
        price = int(d.get("price", 0))
    except (TypeError, ValueError):
        price = 0
    # VULN[secondary-idor]: `where` is concatenated into an internal resource path and
    # normalised, so ../ traversal escapes your own scope into the INTERNAL menu
    # namespace and edits ANY restaurant's item with no ownership check (secondary-
    # context IDOR, e.g. where=../../../../v2/menu/9627043/items/<uuid>).
    resolved = os.path.normpath("/svc/public/menu/myrestaurant/" + where).replace("\\", "/")
    m = re.search(r"/(?:v\d+|internal)/menu/(\w+)/items/([\w-]+)", resolved)
    if m and "myrestaurant" not in resolved:
        rid, uuid = m.group(1), m.group(2)
        item = _MENU_ITEMS.get((rid, uuid))
        if item:
            item["price"] = price  # cross-tenant write, no ownership check
            return jsonify({"updated": True, "restaurant": rid, "item": item, "resolved": resolved})
        return jsonify({"error": "no such item", "restaurant": rid, "resolved": resolved}), 404
    # normal path: edit your own item
    _MENU_ITEMS[("9492893", "self-uuid")]["price"] = price
    return jsonify({"updated": True, "restaurant": "self", "resolved": resolved})


@app.route("/api/config/client")
def client_config():
    # VULN[cache-poisoning]: the response is explicitly cacheable (Cache-Control:
    # public) yet reflects the UNKEYED X-Forwarded-Host header into the asset/redirect
    # URLs. A CDN keys only on the path, so an attacker poisons the cached entry and
    # every later visitor is served links pointing at the attacker's host (also the
    # web-cache-deception vector: a sensitive body cached under a static-looking path).
    host = request.headers.get("X-Forwarded-Host", request.host)
    resp = jsonify({"cdn": f"https://{host}/static", "api": f"https://{host}/api",
                    "login_redirect": f"https://{host}/dashboard", "version": "2.3.1"})
    resp.headers["Cache-Control"] = "public, max-age=600"
    resp.headers["X-Cache"] = "MISS"
    return resp


@app.route("/api/account/recover", methods=["POST"])
def account_recover():
    ident = str((request.get_json(silent=True) or {}).get("identifier", "") or "")
    # VULN[unicode-collision]: the lookup NFKC-normalises + case-folds the identifier,
    # so look-alikes / case / full-width variants collide with a real account
    # (e.g. "ADMIN", "ＡＤＭＩＮ", or a Cyrillic "аdmin" all match "admin") and the
    # recovery token is issued for the matched victim -> 0-click account takeover.
    norm = unicodedata.normalize("NFKC", ident).casefold()
    conn = get_conn()
    rows = conn.execute("SELECT username, email FROM users").fetchall()
    conn.close()
    for r in rows:
        if unicodedata.normalize("NFKC", r["username"]).casefold() == norm or \
           unicodedata.normalize("NFKC", r["email"] or "").casefold() == norm:
            return jsonify({"matched_account": r["username"],
                            "reset_token": "rst_" + r["username"] + "_2024",
                            "message": "Recovery link issued."})
    return jsonify({"error": "no account found"}), 404


@app.route("/api/account/reset-link", methods=["POST"])
def reset_link():
    d = request.get_json(silent=True) or {}
    email = d.get("email", "")
    # VULN[reset-host-param]: the reset link's host is taken from a client-controlled
    # `hostName` body field (not even the Host header), so an attacker sets hostName to
    # their own server and the victim's reset link + token points there (ATO).
    host = d.get("hostName", request.host_url.rstrip("/"))
    return jsonify({"sent": True,
                    "reset_link": f"{host}/reset?email={email}&token=rst_{email}_2024"})


@app.route("/reset")
def reset_landing():
    # VULN[reset-token-referer]: the reset token is carried in the URL AND the page
    # loads a third-party tracker, so the full URL (with the token) leaks to the
    # third party via the Referer header -> token theft / account takeover.
    token = request.args.get("token", "")
    return page("Reset your password", f"""<h1 class="title">Choose a new password</h1>
      <img src="https://analytics.example-cdn.com/px.gif?ref=boxcutter" alt="" width="1" height="1">
      <form class="box" style="max-width:420px" method="post" action="/api/password/reset">
        <input type="hidden" name="token" value="{token}">
        <input class="input mb-2" type="password" name="password" placeholder="New password">
        <button class="button is-info">Set password</button>
      </form>""")


@app.route("/api/cart/price", methods=["POST"])
def cart_price():
    d = request.get_json(silent=True) or {}
    try:
        base = float(d.get("base", 59.0))
    except (TypeError, ValueError):
        base = 59.0
    mods = d.get("modifiers", []) if isinstance(d.get("modifiers"), list) else []
    # VULN[bl-modifier]: each modifier price is summed with no de-duplication, no
    # per-group maximum and no floor, and negative prices are accepted -> duplicating
    # a modifier (or sending a negative-priced add-on) drives the total down, even
    # below zero (the cross-region "modifier multiplication" price-manipulation bug).
    addons = 0.0
    for m in mods:
        try:
            addons += float(m.get("price", 0))
        except (TypeError, ValueError, AttributeError):
            pass
    return jsonify({"base": round(base, 2), "modifiers": len(mods),
                    "total": round(base + addons, 2)})


@app.route("/api/campaigns/boost", methods=["POST"])
def campaign_boost():
    claims, err = _require_jwt()
    if err:
        return err
    d = request.get_json(silent=True) or {}
    # VULN[bl-fee-omit]: a Premium-Boost add-on costs a fee. Setting additional_fee to
    # 0 is rejected, but OMITTING the field entirely skips the validation and enables
    # the paid feature for free (required-field-omission business-logic bypass).
    if "additional_fee" in d:
        try:
            fee = float(d["additional_fee"])
        except (TypeError, ValueError):
            fee = 0.0
        if fee <= 0:
            return jsonify({"error": "additional_fee must be greater than 0"}), 400
        return jsonify({"boosted": True, "premium": True, "charged": fee})
    return jsonify({"boosted": True, "premium": True, "charged": 0.0, "note": "no fee applied"})


# ============================ OpenAPI spec ==================================

def _json(schema):
    return {"content": {"application/json": {"schema": schema}}}


def _ok(desc, schema):
    return {"description": desc, **_json(schema)}


_REF = {"$ref": "#/components/responses/Unauthorized"}
_S = lambda name: {"$ref": f"#/components/schemas/{name}"}  # noqa: E731

OPENAPI = {
    "openapi": "3.0.0",
    "info": {
        "title": "Boxcutter Store API",
        "version": "2.3.1",
        "description": (
            "REST API for the Boxcutter Store storefront.\n\n"
            "**Authentication.** Public endpoints need no credentials. Authenticated "
            "endpoints expect a bearer JWT: `Authorization: Bearer <token>`. Get a token "
            "from `POST /api/login` with a username/password, or from the testing helper "
            "`GET /api/auth/token` (no credentials, low-privilege).\n\n"
            "All responses are JSON. Errors use `{ \"error\": \"...\" }` with a 4xx/5xx status."
        ),
        "contact": {"name": "Boxcutter Platform Team", "email": "api@boxcutter.test"},
    },
    "servers": [{"url": "/", "description": "This server"}],
    "tags": [
        {"name": "public", "description": "No authentication required."},
        {"name": "Authenticated", "description": "Require a bearer JWT."},
        {"name": "JWTTest", "description": "Mint a JWT for testing the authenticated endpoints."},
    ],
    "components": {
        "securitySchemes": {"bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}},
        "schemas": {
            "Product": {"type": "object", "properties": {
                "id": {"type": "integer", "example": 1}, "name": {"type": "string", "example": "Cumulus Hoodie"},
                "price": {"type": "number", "example": 59.0}, "category": {"type": "string", "example": "apparel"}}},
            "User": {"type": "object", "properties": {
                "id": {"type": "integer", "example": 2}, "username": {"type": "string", "example": "alice"},
                "email": {"type": "string", "example": "alice@example.com"}, "role": {"type": "string", "example": "user"}}},
            "Order": {"type": "object", "properties": {
                "id": {"type": "integer", "example": 1001}, "item": {"type": "string", "example": "Cumulus Hoodie"},
                "total": {"type": "number", "example": 59.0}, "address": {"type": "string"}, "card_last4": {"type": "string"}}},
            "Token": {"type": "object", "properties": {
                "token": {"type": "string", "example": "eyJhbGciOiJIUzI1NiIs..."}, "role": {"type": "string", "example": "user"}}},
            "Error": {"type": "object", "properties": {"error": {"type": "string", "example": "invalid credentials"}}},
        },
        "responses": {
            "Unauthorized": {"description": "Missing or invalid bearer token.", **_json(_S("Error"))},
            "NotFound": {"description": "Resource not found.", **_json(_S("Error"))},
        },
    },
    "paths": {
        "/api/products": {"get": {"tags": ["public"], "summary": "Search products",
            "description": "Search the catalogue by product name. Returns every product whose name "
                           "contains `q` (all products if `q` is omitted).",
            "parameters": [{"name": "q", "in": "query", "required": False, "description": "name substring to match",
                            "schema": {"type": "string"}, "example": "hoodie"}],
            "responses": {"200": _ok("Matching products.", {"type": "object", "properties": {
                "products": {"type": "array", "items": _S("Product")}}})}}},
        "/api/products/{id}": {"get": {"tags": ["public"], "summary": "Get a product",
            "description": "Fetch a single product by its numeric id.",
            "parameters": [{"name": "id", "in": "path", "required": True, "description": "product id",
                            "schema": {"type": "integer"}, "example": 1}],
            "responses": {"200": _ok("The product.", _S("Product")), "404": {"$ref": "#/components/responses/NotFound"}}}},
        "/api/users/{id}": {"get": {"tags": ["public"], "summary": "Get a user profile",
            "description": "Fetch a customer's public profile by id.",
            "parameters": [{"name": "id", "in": "path", "required": True, "description": "user id",
                            "schema": {"type": "integer"}, "example": 2}],
            "responses": {"200": _ok("The user profile.", _S("User")), "404": {"$ref": "#/components/responses/NotFound"}}}},
        "/api/login": {"post": {"tags": ["public"], "summary": "Sign in",
            "description": "Exchange a username and password for a bearer JWT. Use the token in the "
                           "`Authorization: Bearer` header on authenticated endpoints.",
            "requestBody": {"required": True, **_json({"type": "object", "required": ["username", "password"],
                "properties": {"username": {"type": "string", "example": "user"},
                               "password": {"type": "string", "example": "user"}}})},
            "responses": {"200": _ok("A signed JWT.", _S("Token")),
                          "401": {"description": "Invalid credentials.", **_json(_S("Error"))}}}},
        "/api/auth/token": {"get": {"tags": ["JWTTest"], "summary": "Mint a test JWT (no credentials)",
            "description": "Returns a short-lived, low-privilege bearer token for exercising the "
                           "authenticated endpoints without real credentials. The token is in `.token`.",
            "x-jwt-test": True,
            "responses": {"200": _ok("A test bearer token.", _S("Token"))}}},
        "/api/me": {"get": {"tags": ["Authenticated"], "summary": "Current user",
            "description": "Return the profile of the user the bearer token belongs to.",
            "security": [{"bearerAuth": []}],
            "responses": {"200": _ok("The signed-in user.", _S("User")), "401": _REF}}},
        "/api/profile": {
            "get": {"tags": ["Authenticated"], "summary": "Get my profile",
                "description": "Return the signed-in customer's profile, including their bio.",
                "security": [{"bearerAuth": []}],
                "responses": {"200": _ok("Your profile.", _S("User")), "401": _REF}},
            "post": {"tags": ["Authenticated"], "summary": "Update my profile",
                "description": "Update the signed-in customer's bio, display name and/or email. "
                               "Fields omitted from the body are left unchanged.",
                "security": [{"bearerAuth": []}],
                "requestBody": {**_json({"type": "object", "properties": {
                    "bio": {"type": "string", "example": "Coffee and notebooks."},
                    "full_name": {"type": "string"}, "email": {"type": "string"}}})},
                "responses": {"200": _ok("The updated profile.", _S("User")), "401": _REF}}},
        "/api/orders/{id}": {"get": {"tags": ["Authenticated"], "summary": "Get an order",
            "description": "Fetch one of your orders by its order number.",
            "security": [{"bearerAuth": []}],
            "parameters": [{"name": "id", "in": "path", "required": True, "description": "order number",
                            "schema": {"type": "integer"}, "example": 1001}],
            "responses": {"200": _ok("The order.", {"type": "object", "properties": {
                "orders": {"type": "array", "items": _S("Order")}}}), "401": _REF}}},
        "/api/admin/search": {"get": {"tags": ["Authenticated"], "summary": "Search users",
            "description": "Search customers by username substring. Returns matching user records.",
            "security": [{"bearerAuth": []}],
            "parameters": [{"name": "q", "in": "query", "description": "username substring",
                            "schema": {"type": "string"}, "example": "ali"}],
            "responses": {"200": _ok("Matching users.", {"type": "object", "properties": {
                "users": {"type": "array", "items": _S("User")}}}), "401": _REF}}},
        "/api/admin/users": {"get": {"tags": ["Authenticated"], "summary": "List all users",
            "description": "Return every user account. Requires an admin role.",
            "security": [{"bearerAuth": []}],
            "responses": {"200": _ok("All users.", {"type": "object", "properties": {
                "users": {"type": "array", "items": _S("User")}}}), "401": _REF,
                "403": {"description": "Admin role required.", **_json(_S("Error"))}}}},
        "/api/account": {"post": {"tags": ["Authenticated"], "summary": "Update account settings",
            "description": "Update the signed-in account's contact details.",
            "security": [{"bearerAuth": []}],
            "requestBody": {**_json({"type": "object", "properties": {
                "email": {"type": "string"}, "full_name": {"type": "string"}}})},
            "responses": {"200": _ok("Updated fields.", {"type": "object"}), "401": _REF}}},
        "/api/v2/login": {"post": {"tags": ["public"], "summary": "Sign in (v2)",
            "description": "Newer login that accepts a JSON username/password and returns a bearer token.",
            "requestBody": {"required": True, **_json({"type": "object",
                "properties": {"username": {"type": "string"}, "password": {"type": "string"}}})},
            "responses": {"200": _ok("A signed JWT.", _S("Token")),
                          "401": {"description": "Invalid credentials.", **_json(_S("Error"))}}}},
        "/api/tools/dns": {"get": {"tags": ["public"], "summary": "Resolve a hostname",
            "description": "Helper that resolves a hostname for the storefront's shipping integrations.",
            "parameters": [{"name": "host", "in": "query", "description": "hostname to resolve",
                            "schema": {"type": "string"}, "example": "example.com"}],
            "responses": {"200": _ok("Lookup result.", {"type": "object", "properties": {
                "host": {"type": "string"}, "output": {"type": "string"}}})}}},
        "/api/files": {"get": {"tags": ["public"], "summary": "Download a document",
            "description": "Download a stored invoice or document by file name.",
            "parameters": [{"name": "name", "in": "query", "description": "file name",
                            "schema": {"type": "string"}, "example": "invoice-1001.txt"}],
            "responses": {"200": {"description": "The file contents (text/plain).",
                "content": {"text/plain": {"schema": {"type": "string"}}}},
                "404": {"$ref": "#/components/responses/NotFound"}}}},
        "/api/categories": {"get": {"tags": ["public"], "summary": "List categories",
            "description": "List the distinct product categories.",
            "responses": {"200": _ok("Category names.", {"type": "object", "properties": {
                "categories": {"type": "array", "items": {"type": "string"}}}})}}},
        "/api/newsletter": {"post": {"tags": ["public"], "summary": "Subscribe to the newsletter",
            "description": "Subscribe an email address to the storefront newsletter.",
            "requestBody": {**_json({"type": "object", "properties": {
                "email": {"type": "string", "example": "you@example.com"}}})},
            "responses": {"200": _ok("Subscription result.", {"type": "object"})}}},
        "/api/status": {"get": {"tags": ["public"], "summary": "Service status",
            "description": "Lightweight status/health for the storefront API.",
            "responses": {"200": _ok("Status.", {"type": "object"})}}},
    },
}


OPENAPI["tags"].append({"name": "store", "description": "Storefront resources (cart, promos, shipping, orders)."})
OPENAPI["paths"].update(_resource_paths())
OPENAPI["paths"].update(_extra_paths())


def _make_ssl_context():
    import ssl
    import tempfile

    try:
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.x509.oid import NameOID
    except ImportError:
        return "adhoc"

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "boxcutter-store")])
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=3650))
        .add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            ]),
            critical=False,
        )
        .sign(key, hashes.SHA256())
    )

    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    key_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    )

    tmp = tempfile.mkdtemp()
    cert_path = os.path.join(tmp, "cert.pem")
    key_path = os.path.join(tmp, "key.pem")
    with open(cert_path, "wb") as f:
        f.write(cert_pem)
    with open(key_path, "wb") as f:
        f.write(key_pem)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(cert_path, key_path)
    return ctx


if __name__ == "__main__":
    init_db()
    https = os.environ.get("HTTPS", "1") not in ("0", "false", "no")
    ssl_context = _make_ssl_context() if https else None
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, ssl_context=ssl_context)
