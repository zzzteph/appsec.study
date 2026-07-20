import jwt from 'jsonwebtoken';

export const SECRET = 'ghost-secret';
export function sign(u) { return jwt.sign({ sub: u.id, username: u.username }, SECRET, { expiresIn: '2h' }); }
export function userFromReq(req) {
  const a = req.headers['authorization'] || '';
  if (!a.startsWith('Bearer ')) return null;
  try { const c = jwt.verify(a.slice(7), SECRET); return { id: c.sub, username: c.username }; }
  catch (e) { return null; }
}
