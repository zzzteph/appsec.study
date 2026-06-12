"""Container entrypoint that selects the server.

Default      -> gunicorn with worker threads. Stays responsive under load (slow
                planted endpoints no longer block everything) and serves plain
                HTTP; terminate TLS and rate-limit in the reverse proxy.
SERVER=dev   -> the original single-process Flask dev server with a self-signed
                cert, for local scanner testing on https://localhost:8000.

Tunables (env): PORT, WEB_WORKERS, WEB_THREADS, WEB_TIMEOUT.
"""

import os
import sys


def main() -> None:
    if os.environ.get("SERVER") == "dev":
        os.execvp(sys.executable, [sys.executable, "app.py"])

    port = os.environ.get("PORT", "8000")
    os.execvp("gunicorn", [
        "gunicorn",
        "--bind", f"0.0.0.0:{port}",
        "--worker-class", "gthread",
        "--workers", os.environ.get("WEB_WORKERS", "2"),
        "--threads", os.environ.get("WEB_THREADS", "8"),
        "--timeout", os.environ.get("WEB_TIMEOUT", "60"),
        "--graceful-timeout", "30",
        "--preload",            # import wsgi once in the master -> init_db runs once
        "wsgi:app",
    ])


if __name__ == "__main__":
    main()
