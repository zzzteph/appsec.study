### graph

**GraphShop** — a Vue 3 marketplace whose **entire API is GraphQL** (Apollo Server), with
**JWT access + refresh** auth. Deliberately vulnerable, GraphQL-first. Single container: the Node
server serves both the built SPA and `/graphql`.

```
docker build -t graph ./vms/graph
docker run --rm -p 8080:80 graph      # app: http://localhost:8080  ·  API: /graphql
```

GraphiQL/Apollo sandbox and introspection are open at `/graphql`. Seed accounts: `admin/adminpass`,
`alice/alice` (+ ~15 UUID users with an invitation graph). Auth is a bearer **access** token;
unauthed users can build a cart (via the `x-cart-id` header the SPA stores) but **checkout requires auth**.

#### Features
Auth (register/login/**refresh**/reset) · multi-shop home · paginated items + search · item **options**
· cart (add unauthed) · checkout (mock card, gift card, referral credit) · orders + **tracking** (flip
to fulfilled/cancelled at random within ~5 min) · reviews · invitations/referral · gift cards ·
vouchers on register · **GraphCMS-style** help articles · profile edits.

#### Planted vulnerabilities (answer key; each tagged `VULN[id]` in the source)

| `VULN[id]` | Where (GraphQL) | Notes |
|---|---|---|
| `graphql-introspection` / `graphiql-exposed` | `/graphql` | full introspection + Apollo sandbox |
| `excessive-data` | `me`, `user(id)` | `User.passwordHash` and a usable `User.accessToken` exposed |
| `bola-order` / `bola-orders` | `order(id)`, `ordersByUser(userId)` | any order / any user's orders, no ownership |
| `bola-user` | `user(id)` | any user record by id |
| `invite-idor` | `invitations(userId)` | discloses the inviter UUID (`me.invitedBy`); re-query with that UUID to see who *they* invited — no ownership check |
| `hidden-admin` | `recentUsers(limit)` | unauth dump of recent users' UUIDs; the query is referenced **only in the SPA JS** (`#/admin`), not linked in the UI |
| `bola-giftcard` | `giftCard(code)`, `redeemGiftCard`, `checkout(giftCardCode)` | read/redeem/apply any code |
| `bola-profile` | `updateProfile(userId:)` | pass a `userId` to edit **another** user |
| `graphql-sqli` | `searchItems(q)`, `searchReviews(q)` | arg concatenated into SQLite; `q:"' OR '1'='1"` / `q:"'"` → error-based |
| `path-traversal` | `invoice(file:)`, `helpDoc(path:)` | `file:"../../../../etc/passwd"` reads arbitrary files |
| `xss-stored-review` | `addReview` → shop reviews (`v-html`) | stored XSS |
| `graphql-cms-unauth` | `updateArticle` | rewrite any help article with **no auth** (pairs with `v-html` → stored XSS) |
| `mass-assignment` | `register(input:{role,credits})` | set your own `role:"admin"` / `credits` |
| `jwt-weak-secret` / `refresh-weak-secret` | tokens | HS256 secrets `graphshop-secret` / `graphshop-refresh` — forge any token |
| `refresh-no-rotation` | `refresh` | refresh tokens never rotated/revoked (replayable) |
| `weak-reset` / `reset-token-leak` | `requestPasswordReset`, `resetPassword` | token = `base64("reset:"+username)` and returned in the response |
| `price-tamper` | `checkout(total:)` | client-supplied total is trusted |
| `option-price-abuse` | `addToCart(optionIds:)` | options summed with no dedupe / single-select / floor — stack the negative "Small" delta to zero-out or go negative |
| `user-enum` | `login`, `register`, `updateProfile`, `invite`, `redeemGiftCard` | distinct messages on state changes leak existence |
| `login-as` | `loginAs(userId)` | mint any user's tokens, **no admin check** (full impersonation/ATO) |
| `email-change-ato` | `changeEmail(email, userId)` | set **another** user's email, no verification |
| `credits-transfer` | `transferCredits(toUserId, amount)` | negative `amount` drains the target's balance |
| `refund-abuse` | `refundOrder(orderId, amount)` | refund **any** order (BOLA), unbounded amount → free credits; `cancelOrder` any order |
| `coupon-stacking` | `checkout(coupons: [..])` | same/multiple coupons stack with no dedupe or cap |
| `no-stock-check` | `checkout` | stock never validated/decremented (oversell); negative `qty` → negative line |
| `giftcard-enum` | `buyGiftCard`, `giftCard(code)` | sequential `GC-00000N` codes → enumerable |
| `bfla` / `privesc` | `becomeSeller`, `createItem`, `updateItem(price:)`, `updateShop` | anyone becomes a seller and edits any shop/item (negative prices) |
| `ssrf` | `registerWebhook(url)` | server fetches an arbitrary URL |
| `file-upload` | `uploadAsset(filename, contentBase64)` | no type/name check → filename **path traversal** + stored XSS (served from `/uploads`) |
| `bola-notes` / `xss-stored-note` | `addOrderNote`, `orderNotes(orderId)` | read/write notes on any order; stored content |
| `bola-favorites` | `favorites(userId)` | read any user's wishlist |
| `verbose-errors` | all | stack traces returned in the GraphQL error `extensions` |

Example — SQLi + traversal + IDOR:
```graphql
{ searchItems(q: "' UNION SELECT id,name,price,description,category,shopId FROM items -- ") { id name } }
{ invoice(file: "../../../../etc/passwd") }
{ me { id invitedBy } }                 # then:
{ invitations(userId: "<that-uuid>") { invitee { username id } } }
```

Deliberately insecure by design — run only locally / on an isolated network.
