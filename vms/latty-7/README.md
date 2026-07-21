### latty-7

**Latty-7 (MenuForge)** — a restaurant **partner menu editor**: a Vue 3 SPA built with **webpack
(production / minified)** + Node/Express + JWT. Deep, nested functionality — sign in, open the **Menu**
tab, browse your **menus**, open a menu to see its **items**, and edit an entry.

```
docker build -t latty-7 ./vms/latty-7
docker run --rm -p 8080:80 latty-7      # http://localhost:8080
```

Two partner accounts: **`test1 / test1`** and **`test2 / test2`**. Each owns one restaurant → menus →
items, all addressed by **UUIDs**. The minified webpack bundle doesn't advertise the nested API — you
learn it by using the app (or reading the bundle).

#### The vulnerability — IDOR with unpredictable identifiers (`VULN[bola]`)
The API is nested by UUID:
```
/api/restaurant/{RID}/menu/{MID}/items/{IID}
```
Every endpoint validates the JWT and checks the resource **exists and is nested correctly** — but it
**never checks the restaurant/menu/item belongs to the caller**. There are **no authorization checks
anywhere**; full CRUD (`GET/POST/PUT/DELETE`) on any partner's menus and items is allowed *if you know
the UUIDs*.

Because the IDs are UUIDs you can't enumerate them — so the intended solve is **cross-referencing the
two accounts**: sign in as `test2`, read its `restaurantId` from `GET /api/me`; then with **`test1`'s**
token walk and tamper `test2`'s whole tree at `/api/restaurant/{test2-RID}/...` (list menus, read items,
**edit / create / delete** them). A random UUID still `404`s — proving the point that *unpredictable
identifiers are not an access control*.

Deliberately insecure by design — run only locally / on an isolated network.
