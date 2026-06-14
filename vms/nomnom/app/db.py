"""In-memory data store for the NomNom API.

Seeded at import time; mutated by the routers. No real database, so there is no
SQL injection here — the planted bugs are API-layer flaws (authz, business
logic, data exposure), which is where most real food-delivery API bugs live.
"""
from itertools import count

# --- users (password stored in clear on purpose — VULN[secrets-plaintext]) ---
users = [
    {"id": "u1", "name": "Alice Customer", "email": "alice@nomnom.test", "password": "alice123",
     "role": "customer", "referral_code": "ALICE10", "wallet": 5.0, "addresses": [], "payment_methods": []},
    {"id": "u2", "name": "Bob Owner", "email": "bob@nomnom.test", "password": "bobpass",
     "role": "owner", "referral_code": "BOB10", "wallet": 0.0, "addresses": [], "payment_methods": []},
    {"id": "u3", "name": "Carol Admin", "email": "admin@nomnom.test", "password": "S3cr3tAdm!n",
     "role": "admin", "referral_code": "ADMIN", "wallet": 0.0, "addresses": [], "payment_methods": []},
]
users_by_id = {u["id"]: u for u in users}
_user_seq = count(4)

restaurants = [
    {"id": 1, "name": "Pizza Palace", "cuisine": "Italian", "address": "1 High St", "rating": 4.5, "owner_id": "u2", "is_open": True, "hours": "11:00-23:00"},
    {"id": 2, "name": "Sushi Zen", "cuisine": "Japanese", "address": "2 Market Rd", "rating": 4.7, "owner_id": "u2", "is_open": True, "hours": "12:00-22:00"},
    {"id": 3, "name": "Burger Barn", "cuisine": "American", "address": "3 Dock Ln", "rating": 4.1, "owner_id": "u2", "is_open": False, "hours": "10:00-00:00"},
]
_restaurant_seq = count(4)

menu_items = [
    {"id": 1, "restaurant_id": 1, "name": "Margherita", "price": 8.5, "category": "pizza"},
    {"id": 2, "restaurant_id": 1, "name": "Pepperoni", "price": 10.0, "category": "pizza"},
    {"id": 3, "restaurant_id": 2, "name": "Salmon Nigiri", "price": 6.0, "category": "sushi"},
    {"id": 4, "restaurant_id": 3, "name": "Double Cheeseburger", "price": 9.5, "category": "burger"},
]
_menu_seq = count(5)

categories = [
    {"id": 1, "name": "pizza"}, {"id": 2, "name": "sushi"}, {"id": 3, "name": "burger"},
]
_category_seq = count(4)

modifiers = [
    {"id": 1, "name": "Extra cheese", "price": 1.0},
    {"id": 2, "name": "No onions", "price": 0.0},
]
_modifier_seq = count(3)

baskets = {}            # bid -> basket
_basket_seq = count(1)

orders = [
    {"id": 1, "user_id": "u1", "restaurant_id": 1, "items": [{"item_id": 1, "qty": 2}],
     "total": 17.0, "status": "delivered", "address": "1 High St"},
    {"id": 2, "user_id": "u2", "restaurant_id": 2, "items": [{"item_id": 3, "qty": 4}],
     "total": 24.0, "status": "preparing", "address": "2 Market Rd"},
]
_order_seq = count(3)

payments = [
    {"id": 1, "order_id": 1, "amount": 17.0, "method": "card", "status": "captured", "card": "4242424242424242"},
]
_payment_seq = count(2)

drivers = [
    {"id": 1, "name": "Dan Driver", "phone": "+44 7700 900111", "lat": 51.50, "lng": -0.12, "status": "available"},
]
_driver_seq = count(2)

deliveries = [
    {"id": 1, "order_id": 1, "driver_id": 1, "status": "completed"},
]
_delivery_seq = count(2)

reviews = [
    {"id": 1, "restaurant_id": 1, "user_id": "u1", "rating": 5, "text": "Great pizza!", "reply": None},
]
_review_seq = count(2)

promos = [
    {"code": "WELCOME10", "percent": 10, "active": True},
    {"code": "BIGSAVE50", "percent": 50, "active": True},
]

referrals = [
    {"code": "ALICE10", "owner_id": "u1", "redeemed_by": []},
]

notifications = [
    {"id": 1, "user_id": "u1", "text": "Your order #1 was delivered", "read": False},
]
_notification_seq = count(2)


# --- id helpers ---
def new_user_id():
    return f"u{next(_user_seq)}"


def find(collection, key, value):
    for item in collection:
        if item.get(key) == value:
            return item
    return None


# ============================ bulk stub data ============================
# Generate a lot of believable data so the API isn't empty (and so injection /
# enumeration / IDOR have something to chew on). Deterministic via a fixed seed.
import random as _rnd
import sqlite3

_r = _rnd.Random(1337)
_FIRST = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Drew",
          "Quinn", "Avery", "Parker", "Reese", "Skyler", "Hayden", "Rowan", "Emerson", "Sage"]
_LAST = ["Smith", "Jones", "Khan", "Patel", "Nguyen", "Garcia", "Muller", "Rossi", "Kim",
         "Silva", "Brown", "Wilson", "Lee", "Walsh", "Novak", "Haas", "Costa", "Tanaka"]
_CUISINES = ["Italian", "Japanese", "American", "Indian", "Thai", "Mexican", "Greek", "Korean", "French"]
_DISHES = ["Margherita", "Pepperoni", "Salmon Nigiri", "Cheeseburger", "Pad Thai", "Tikka Masala",
           "Gyros", "Falafel Wrap", "Bibimbap", "Croissant", "Ramen", "Tacos", "Caesar Salad",
           "Pho", "Burrito", "Katsu Curry", "Lasagne", "Dumplings", "Fish and Chips", "Espresso"]
_SUFFIX = ["House", "Kitchen", "Bar", "Express", "Grill", "Corner", "Co."]

for _ in range(147):  # users u4..u150
    uid = new_user_id()
    fn, ln = _r.choice(_FIRST), _r.choice(_LAST)
    u = {"id": uid, "name": f"{fn} {ln}",
         "email": f"{fn.lower()}.{ln.lower()}{uid[1:]}@nomnom.test",
         "password": f"{fn.lower()}{_r.randint(100, 999)}", "role": "customer",
         "referral_code": f"{fn[:3].upper()}{_r.randint(10, 99)}",
         "wallet": round(_r.uniform(0, 25), 2), "addresses": [], "payment_methods": []}
    users.append(u)
    users_by_id[uid] = u

for _ in range(47):  # restaurants 4..50
    restaurants.append({"id": next(_restaurant_seq),
        "name": f"{_r.choice(_DISHES).split()[0]} {_r.choice(_SUFFIX)}",
        "cuisine": _r.choice(_CUISINES), "address": f"{_r.randint(1, 200)} {_r.choice(['High', 'Market', 'Dock', 'King', 'Queen'])} St",
        "rating": round(_r.uniform(3.0, 5.0), 1), "owner_id": "u2",
        "is_open": _r.random() > 0.2, "hours": "10:00-23:00"})

for rest in list(restaurants):  # menu items per restaurant
    for _ in range(_r.randint(4, 9)):
        menu_items.append({"id": next(_menu_seq), "restaurant_id": rest["id"],
            "name": _r.choice(_DISHES), "price": round(_r.uniform(4, 18), 2),
            "category": _r.choice(["pizza", "sushi", "burger", "mains", "sides", "drinks"])})

_STATUSES = ["pending", "preparing", "delivering", "delivered", "cancelled"]
for _ in range(600):  # orders
    rest = _r.choice(restaurants)
    item_ids = [m["id"] for m in menu_items if m["restaurant_id"] == rest["id"]] or [1]
    orders.append({"id": next(_order_seq), "user_id": _r.choice(users)["id"],
        "restaurant_id": rest["id"], "items": [{"item_id": _r.choice(item_ids), "qty": _r.randint(1, 4)}],
        "total": round(_r.uniform(8, 60), 2), "status": _r.choice(_STATUSES),
        "address": f"{_r.randint(1, 200)} High St"})

for o in _r.sample(orders, min(300, len(orders))):  # payments
    payments.append({"id": next(_payment_seq), "order_id": o["id"], "amount": o["total"],
        "method": _r.choice(["card", "wallet", "cash"]),
        "status": _r.choice(["captured", "refunded", "pending"]),
        "card": f"4242{_r.randint(100000000000, 999999999999)}"})

for _ in range(200):  # reviews
    reviews.append({"id": next(_review_seq), "restaurant_id": _r.choice(restaurants)["id"],
        "user_id": _r.choice(users)["id"], "rating": _r.randint(1, 5),
        "text": _r.choice(["Great!", "Cold fries.", "Fast delivery.", "Would order again.", "Meh."]), "reply": None})

for _ in range(40):  # drivers
    drivers.append({"id": next(_driver_seq), "name": f"{_r.choice(_FIRST)} {_r.choice(_LAST)}",
        "phone": f"+44 7700 9{_r.randint(10000, 99999)}", "lat": round(51 + _r.random(), 4),
        "lng": round(-0.2 + _r.random() * 0.4, 4), "status": _r.choice(["available", "busy", "offline"])})

for u in _r.sample(users, 30):  # referral codes
    if not find(referrals, "code", u["referral_code"]):
        referrals.append({"code": u["referral_code"], "owner_id": u["id"], "redeemed_by": []})

# SQLite mirror backing the (injectable) dish-search endpoint — VULN[sqli] lives there.
sql_conn = sqlite3.connect(":memory:", check_same_thread=False)
sql_conn.row_factory = sqlite3.Row
sql_conn.execute("CREATE TABLE dishes (id INTEGER, name TEXT, price REAL, category TEXT, restaurant_id INTEGER)")
sql_conn.executemany("INSERT INTO dishes VALUES (?,?,?,?,?)",
                     [(m["id"], m["name"], m["price"], m["category"], m["restaurant_id"]) for m in menu_items])
sql_conn.commit()
