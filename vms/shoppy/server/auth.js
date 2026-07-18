import jwt from 'jsonwebtoken';

// VULN[jwt-weak-secret]: guessable HS256 secret for access tokens.
export const JWT_SECRET = 'shoppy-secret';
// VULN[refresh-weak-secret]: guessable secret for refresh tokens too.
export const REFRESH_SECRET = 'shoppy-refresh';

export function signAccess(u) {
  return jwt.sign({ sub: u.id, username: u.username, role: u.role, type: 'access' },
    JWT_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}
export function signRefresh(u) {
  return jwt.sign({ sub: u.id, type: 'refresh' }, REFRESH_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
}
// VULN[refresh-no-rotation]: refresh tokens are never rotated or revoked (replayable forever).
export function verifyRefresh(t) {
  return jwt.verify(t, REFRESH_SECRET, { algorithms: ['HS256'] });
}
export function authPayload(u) {
  return { accessToken: signAccess(u), refreshToken: signRefresh(u), user: u };
}

export function contextFromReq(req) {
  const auth = req.headers['authorization'] || '';
  const cartId = req.headers['x-cart-id'] || null;
  let user = null;
  if (auth.startsWith('Bearer ')) {
    try {
      const c = jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
      user = { id: String(c.sub), username: c.username, role: c.role };
    } catch (e) { /* anonymous */ }
  }
  return { user, cartId };
}
