"""Production WSGI entrypoint: ``gunicorn wsgi:app``.

This is the *same* Flask app (and the same planted vulnerabilities) as app.py -
it only makes sure the SQLite store exists before workers start serving, and it
leaves TLS to the upstream proxy (nginx). For the dev server + self-signed HTTPS
path used in local scanner testing, run ``python app.py`` directly instead.
"""

from app import app  # re-exported for gunicorn (wsgi:app)
from db import init_db

init_db()

__all__ = ["app"]
