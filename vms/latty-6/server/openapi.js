// OpenAPI 3 spec for the Bytebites delivery API (served at /openapi.json, rendered by Swagger UI at /docs).
const bearer = [{ bearerAuth: [] }]
const idParam = (name = 'id') => ({ name, in: 'path', required: true, schema: { type: 'integer' } })
const jsonBody = (props, required) => ({ required: true, content: { 'application/json': { schema: { type: 'object', properties: props, required } } } })

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Bytebites API',
    version: '1.0.0',
    description: 'Food-ordering & delivery API. **Authentication:** every endpoint requires a Bearer JWT '
      + 'except `POST /auth/token`. Get a token from `POST /auth/token` (supply a `userId`), press '
      + '**Authorize**, then call the rest of the API.',
  },
  servers: [{ url: '/' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  security: bearer,
  tags: [
    { name: 'auth' }, { name: 'account' }, { name: 'restaurants' }, { name: 'basket' }, { name: 'orders' }, { name: 'tools' },
  ],
  paths: {
    '/auth/token': {
      post: {
        tags: ['auth'], summary: 'Issue a JWT for a user (test auth — no authentication required)',
        security: [], requestBody: jsonBody({ userId: { type: 'integer', example: 1 } }, ['userId']),
        responses: { 200: { description: 'JWT for the given user' } },
      },
    },
    '/me': { get: { tags: ['account'], summary: 'Current user', security: bearer, responses: { 200: { description: 'user' } } } },
    '/restaurants': { get: { tags: ['restaurants'], summary: 'List restaurants', security: bearer, responses: { 200: { description: 'list' } } } },
    '/restaurants/{id}': { get: { tags: ['restaurants'], summary: 'Restaurant + menu', security: bearer, parameters: [idParam()], responses: { 200: { description: 'restaurant' } } } },
    '/restaurants/{id}/logo': {
      post: {
        tags: ['tools'], summary: 'Import a restaurant logo from a URL', security: bearer, parameters: [idParam()],
        requestBody: jsonBody({ url: { type: 'string', example: 'https://example.com/logo.png' } }, ['url']),
        responses: { 200: { description: 'fetched content' } },
      },
    },
    '/users/{id}': { get: { tags: ['account'], summary: 'Get a user profile', security: bearer, parameters: [idParam()], responses: { 200: { description: 'user' } } } },
    '/users/{id}/addresses': { get: { tags: ['account'], summary: "List a user's addresses", security: bearer, parameters: [idParam()], responses: { 200: { description: 'addresses' } } } },
    '/addresses/{id}': { get: { tags: ['account'], summary: 'Get an address', security: bearer, parameters: [idParam()], responses: { 200: { description: 'address' } } } },
    '/baskets': { post: { tags: ['basket'], summary: 'Create a basket', security: bearer, requestBody: jsonBody({ restaurantId: { type: 'integer', example: 101 } }), responses: { 201: { description: 'basket' } } } },
    '/baskets/{id}': { get: { tags: ['basket'], summary: 'Get a basket', security: bearer, parameters: [idParam()], responses: { 200: { description: 'basket' } } } },
    '/baskets/{id}/items': {
      post: {
        tags: ['basket'], summary: 'Add an item to a basket', security: bearer, parameters: [idParam()],
        requestBody: jsonBody({ menuItemId: { type: 'integer', example: 1001 }, quantity: { type: 'integer', example: 1 } }, ['menuItemId', 'quantity']),
        responses: { 200: { description: 'basket' } },
      },
    },
    '/baskets/{id}/promo': {
      post: {
        tags: ['basket'], summary: 'Apply a promo code', security: bearer, parameters: [idParam()],
        requestBody: jsonBody({ code: { type: 'string', example: 'SAVE5' } }, ['code']), responses: { 200: { description: 'promos' } },
      },
    },
    '/orders': {
      get: { tags: ['orders'], summary: 'My orders', security: bearer, responses: { 200: { description: 'orders' } } },
      post: { tags: ['orders'], summary: 'Place an order from a basket', security: bearer, requestBody: jsonBody({ basketId: { type: 'integer' }, addressId: { type: 'integer' } }, ['basketId']), responses: { 201: { description: 'order' } } },
    },
    '/orders/{id}': { get: { tags: ['orders'], summary: 'Get an order', security: bearer, parameters: [idParam()], responses: { 200: { description: 'order' } } } },
    '/orders/{id}/refund': { post: { tags: ['orders'], summary: 'Request a refund', security: bearer, parameters: [idParam()], requestBody: jsonBody({ amount: { type: 'number' } }), responses: { 200: { description: 'refund' } } } },
    '/orders/{id}/receipt': {
      post: {
        tags: ['orders'], summary: 'Render a custom receipt from a template', security: bearer, parameters: [idParam()],
        requestBody: jsonBody({ template: { type: 'string', example: 'Order {{ order.id }} — total {{ total }}' } }, ['template']),
        responses: { 200: { description: 'rendered receipt' } },
      },
    },
  },
}
