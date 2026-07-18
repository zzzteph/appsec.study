export const typeDefs = `#graphql
  type Shop { id: ID!, name: String!, description: String, items(search: String, page: Int, pageSize: Int): ItemPage!, reviews: [Review!]! }
  type ItemOption { id: ID!, group: String!, name: String!, priceDelta: Float! }
  type Item { id: ID!, name: String!, price: Float!, description: String, category: String, stock: Int!, shop: Shop!, options: [ItemOption!]! }
  type ItemPage { items: [Item!]!, total: Int!, page: Int!, pageSize: Int! }

  type User {
    id: ID!, username: String!, address: String, email: String, credits: Float!, voucher: String,
    role: String!, invitedBy: ID, favorites: [Item!]!, passwordHash: String, accessToken: String
  }
  type Invitation { inviter: ID!, invitee: User! }

  type CartLine { item: Item!, qty: Int!, options: [ItemOption!]!, lineTotal: Float! }
  type Cart { id: ID!, lines: [CartLine!]!, total: Float! }
  type Order { id: ID!, lines: [CartLine!]!, total: Float!, status: String!, createdAt: String!, cardLast4: String, userId: ID!, trackingCode: String! }
  type Review { id: ID!, shopId: ID!, author: String!, rating: Int!, text: String! }
  type GiftCard { code: String!, balance: Float!, ownerId: ID }
  type Coupon { code: String!, percent: Int!, active: Boolean! }
  type Article { id: ID!, slug: String!, question: String!, answer: String! }
  type Note { id: ID!, orderId: ID!, author: String!, text: String! }
  type Webhook { id: ID!, url: String!, ownerId: ID }

  type AuthPayload { accessToken: String!, refreshToken: String!, user: User! }
  type ResetToken { token: String! }

  input CardInput { number: String!, exp: String!, cvc: String! }
  input RegisterInput { username: String!, password: String!, role: String, credits: Float }
  input ProfileInput { username: String, password: String, address: String }

  type Query {
    shops: [Shop!]!
    shop(id: ID!): Shop
    items(shopId: ID, search: String, page: Int, pageSize: Int): ItemPage!
    item(id: ID!): Item
    searchItems(q: String!): [Item!]!
    searchReviews(q: String!): [Review!]!
    me: User
    user(id: ID!): User
    recentUsers(limit: Int): [User!]!
    cart: Cart
    order(id: ID!): Order
    myOrders: [Order!]!
    ordersByUser(userId: ID!): [Order!]!
    invitations(userId: ID!): [Invitation!]!
    reviews(shopId: ID!): [Review!]!
    giftCard(code: String!): GiftCard
    coupons: [Coupon!]!
    articles: [Article!]!
    article(slug: String!): Article
    invoice(orderId: ID!, file: String): String
    helpDoc(path: String!): String
    orderNotes(orderId: ID!): [Note!]!
    favorites(userId: ID!): [Item!]!
    webhooks: [Webhook!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    loginAs(userId: ID!): AuthPayload!
    refresh(refreshToken: String!): AuthPayload!
    requestPasswordReset(username: String!): ResetToken!
    resetPassword(username: String!, token: String!, newPassword: String!): Boolean!
    addToCart(itemId: ID!, qty: Int, optionIds: [ID!]): Cart!
    removeFromCart(itemId: ID!): Cart!
    checkout(card: CardInput!, total: Float, giftCardCode: String, coupons: [String!]): Order!
    updateProfile(input: ProfileInput!, userId: ID): User!
    changeEmail(email: String!, userId: ID): User!
    invite(username: String!): String!
    buyGiftCard(amount: Float!, card: CardInput!): GiftCard!
    redeemGiftCard(code: String!): GiftCard!
    transferCredits(toUserId: ID!, amount: Float!): User!
    refundOrder(orderId: ID!, amount: Float): Float!
    cancelOrder(orderId: ID!): Order!
    addReview(shopId: ID!, rating: Int!, text: String!): Review!
    updateArticle(slug: String!, question: String!, answer: String!): Article!
    addOrderNote(orderId: ID!, text: String!): Note!
    addFavorite(itemId: ID!): [Item!]!
    becomeSeller: User!
    createItem(shopId: ID!, name: String!, price: Float!): Item!
    updateItem(id: ID!, name: String, price: Float, stock: Int): Item!
    updateShop(id: ID!, name: String, description: String): Shop!
    registerWebhook(url: String!): String!
    uploadAsset(filename: String!, contentBase64: String!): String!
  }
`;
