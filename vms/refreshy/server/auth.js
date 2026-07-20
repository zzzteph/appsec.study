import jwt from 'jsonwebtoken';

export const ACCESS_SECRET = 'refreshy-access-secret';
export const REFRESH_SECRET = 'refreshy-refresh-secret';

// Access tokens live 2 minutes; every write needs a fresh one, obtained by
// exchanging the (longer-lived) refresh token at POST /api/refresh.
export function signAccess(u) { return jwt.sign({ sub: u.id, username: u.username, type: 'access' }, ACCESS_SECRET, { expiresIn: '2m' }); }
export function signRefresh(u) { return jwt.sign({ sub: u.id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '1d' }); }
export function tokens(u) { return { accessToken: signAccess(u), refreshToken: signRefresh(u) }; }
export function verifyAccess(t) { return jwt.verify(t, ACCESS_SECRET); }
export function verifyRefresh(t) { return jwt.verify(t, REFRESH_SECRET); }
