"""SQLite store for the Boxcutter test target: schema + seed + helpers.

A custom ``sleep(n)`` SQL function is registered on every connection so that
time-based blind SQLi payloads (``... AND sleep(5)``) actually delay - SQLite
has no native SLEEP(), and this is what lets a scanner confirm time-based blind.
"""

from __future__ import annotations

import os
import sqlite3
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "store.db")


def get_conn() -> sqlite3.Connection:
    # timeout + WAL + busy_timeout let the threaded workers (gunicorn gthread)
    # read and write concurrently instead of serialising on one lock and piling
    # up "database is locked" errors under load.
    conn = sqlite3.connect(DB_PATH, timeout=30, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=5000")
    # Makes time-based blind SQLi observable. Capped so a scan can't hang us.
    conn.create_function("sleep", 1, lambda n: time.sleep(min(float(n or 0), 8)))
    return conn


def init_db() -> None:
    fresh = not os.path.exists(DB_PATH)
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT,
            role TEXT, full_name TEXT, api_token TEXT, bio TEXT
        );
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL,
            description TEXT, internal_sku TEXT
        );
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY, product_id INTEGER, author TEXT, body TEXT
        );
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY, user_id INTEGER, item TEXT, total REAL,
            address TEXT, card_last4 TEXT, status TEXT, code TEXT
        );
        CREATE TABLE IF NOT EXISTS help_articles (
            slug TEXT PRIMARY KEY, id INTEGER, title TEXT, body TEXT, published INTEGER
        );
        """
    )
    if fresh:
        cur.executemany(
            "INSERT INTO users (id, username, password, email, role, full_name, api_token, bio) VALUES (?,?,?,?,?,?,?,?)",
            [
                (1, "admin", "S3cur3Adm!n", "admin@boxcutter.test", "admin", "Site Administrator", "tok_admin_9f3c1a", "Running the show."),
                (2, "alice", "alice123", "alice@example.com", "user", "Alice Walker", "tok_alice_5b2d77", "Coffee and notebooks."),
                (3, "bob", "hunter2", "bob@example.com", "user", "Bob Stone", "tok_bob_aa1199", "Backpacker and coffee snob."),
                (4, "carol", "p@ssw0rd", "carol@example.com", "user", "Carol King", "tok_carol_77ee22", "Product designer."),
                (5, "user", "user", "user@example.com", "user", "Test User", "tok_user_123456", "Hi! Edit my bio under Settings."),
            ],
        )
        cur.executemany(
            "INSERT INTO products (id, name, category, price, description, internal_sku) VALUES (?,?,?,?,?,?)",
            [
                (1, "Cumulus Hoodie", "apparel", 59.0, "Soft fleece hoodie.", "SKU-INT-1001"),
                (2, "Boxcutter Mug", "home", 14.5, "Ceramic 350ml mug.", "SKU-INT-1002"),
                (3, "Stratus Backpack", "bags", 89.0, "25L water-resistant pack.", "SKU-INT-1003"),
                (4, "Altocumulus Cap", "apparel", 24.0, "Adjustable cotton cap.", "SKU-INT-1004"),
                (5, "Cirrus Notebook", "stationery", 9.0, "A5 dotted notebook.", "SKU-INT-1005"),
            ],
        )
        cur.executemany(
            "INSERT INTO reviews (id, product_id, author, body) VALUES (?,?,?,?)",
            [
                (1, 1, "alice", "Really cozy, runs a bit large."),
                (2, 1, "bob", "Great quality for the price."),
                (3, 3, "carol", "Fits a 15in laptop perfectly."),
            ],
        )
        cur.executemany(
            "INSERT INTO orders (id, user_id, item, total, address, card_last4, status) VALUES (?,?,?,?,?,?,?)",
            [
                (1001, 2, "Cumulus Hoodie", 59.0, "12 Alder St, Portland", "4242", "fulfilled"),
                (1002, 3, "Stratus Backpack", 89.0, "5 Birch Ave, Austin", "1881", "fulfilled"),
                (1003, 2, "Boxcutter Mug", 14.5, "12 Alder St, Portland", "4242", "fulfilled"),
                (1004, 4, "Cirrus Notebook", 9.0, "9 Cedar Rd, Denver", "0007", "fulfilled"),
            ],
        )
        cur.executemany(
            "INSERT INTO help_articles (slug, id, title, body, published) VALUES (?,?,?,?,?)",
            [
                ("shipping", 1, "Shipping & delivery", "<p>Orders ship within 2 business days, carbon-neutral.</p>", 1),
                ("returns", 2, "Returns & refunds", "<p>Free 30-day returns, no questions asked.</p>", 1),
                ("payments", 3, "Payment methods", "<p>We accept all major cards. Test mode supports 4242 4242 4242 4242.</p>", 1),
            ],
        )
    conn.commit()
    conn.close()
