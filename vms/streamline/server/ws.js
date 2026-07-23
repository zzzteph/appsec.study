// Streamline realtime server. Planted: V1 (CSWSH — the upgrade does NOT validate
// Origin, and authenticates from the cookie the browser sends cross-site), V2
// (missing auth — a connection with no/invalid token is still accepted and can
// join any room), V3 (join has no room-membership check → read private rooms),
// V4 (sender spoofing — client-supplied `sender` trusted), V5 (message text is
// broadcast/stored raw → stored XSS).
const { WebSocketServer } = require('ws')
const url = require('url')
const { verify, cookieToken } = require('./auth')
const { db } = require('./db')

function broadcast(wss, roomId, payload) {
  const s = JSON.stringify(payload)
  wss.clients.forEach(c => { if (c.readyState === 1 && c.rooms && c.rooms.has(roomId)) c.send(s) })
}
const findRoom = (r) => db.prepare('SELECT * FROM rooms WHERE name = ? OR id = ?').get(String(r), r)

function attach(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })   // no verifyClient / no Origin allow-list (V1 CSWSH)
  wss.on('connection', (ws, req) => {
    const q = url.parse(req.url, true).query
    const claims = verify(q.token || cookieToken(req) || '')
    ws.user = claims ? claims.username : 'guest'              // V2: unauthenticated connections still allowed
    ws.rooms = new Set()
    ws.send(JSON.stringify({ type: 'welcome', user: ws.user }))
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw) } catch { return }
      if (m.type === 'join') {
        const room = findRoom(m.room)
        if (!room) return ws.send(JSON.stringify({ type: 'error', error: 'no such room' }))
        ws.rooms.add(room.id)   // V3: no membership check — join any room, incl. private
        const messages = db.prepare('SELECT sender,text,created FROM messages WHERE room_id = ? ORDER BY id').all(room.id)
        ws.send(JSON.stringify({ type: 'history', room: room.name, private: !!room.private, messages }))
      } else if (m.type === 'msg') {
        const room = findRoom(m.room); if (!room) return
        const sender = m.sender || ws.user                    // V4: sender spoofing
        const text = String(m.text || '')                     // V5: stored/broadcast raw
        db.prepare("INSERT INTO messages(room_id,sender,text,created) VALUES (?,?,?, datetime('now'))").run(room.id, sender, text)
        broadcast(wss, room.id, { type: 'msg', room: room.name, sender, text })
      } else if (m.type === 'rooms') {
        ws.send(JSON.stringify({ type: 'rooms', rooms: db.prepare('SELECT id,name,private FROM rooms').all() }))
      }
    })
  })
}
module.exports = { attach }
