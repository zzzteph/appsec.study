// EdgeCam NVR data model + deterministic seed. Cleartext device credentials
// (embedded-device style). Includes the default admin/admin and a hidden
// hardcoded "support" backdoor.
const Database = require('better-sqlite3')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, hidden INTEGER );
CREATE TABLE cameras ( id INTEGER PRIMARY KEY, name TEXT, channel INTEGER, status TEXT, rtsp TEXT );
CREATE TABLE recordings ( id INTEGER PRIMARY KEY, camera_id INTEGER, started TEXT, duration INTEGER, size_mb REAL, path TEXT );
CREATE TABLE settings ( key TEXT PRIMARY KEY, value TEXT );
`)

// V1 default creds (admin/admin) · V6 hidden support backdoor (support/support)
;[
  ['admin', 'admin', 'admin', 0],
  ['viewer', 'viewer', 'viewer', 0],
  ['support', 'support', 'admin', 1],   // hardcoded vendor backdoor, hidden from the UI
].forEach((u, i) => db.prepare('INSERT INTO users(id,username,password,role,hidden) VALUES (?,?,?,?,?)').run(i + 1, u[0], u[1], u[2], u[3]))

;[
  ['Front Door', 1, 'online', 'rtsp://192.168.1.50:554/ch1'],
  ['Parking Lot', 2, 'online', 'rtsp://192.168.1.50:554/ch2'],
  ['Warehouse', 3, 'online', 'rtsp://192.168.1.50:554/ch3'],
  ['Server Room', 4, 'offline', 'rtsp://192.168.1.50:554/ch4'],
].forEach((c, i) => db.prepare('INSERT INTO cameras(id,name,channel,status,rtsp) VALUES (?,?,?,?,?)').run(i + 1, c[0], c[1], c[2], c[3]))

let rid = 1
for (let cam = 1; cam <= 4; cam++) for (let r = 0; r < 3; r++) db.prepare('INSERT INTO recordings(id,camera_id,started,duration,size_mb,path) VALUES (?,?,?,?,?,?)').run(rid++, cam, '2024-05-2' + r + 'T08:00:00Z', 3600, 480 + r * 20, `/rec/ch${cam}/2024-05-2${r}.mp4`)

;[
  ['device_name', 'EdgeCam NVR-2000'], ['firmware', '3.1.4'], ['ip', '192.168.1.50'],
  ['admin_password', 'admin'], ['cloud_key', 'ec_cloud_live_9f2a7b1c4d'], ['ntp', 'pool.ntp.org'], ['timezone', 'UTC'],
].forEach(s => db.prepare('INSERT INTO settings(key,value) VALUES (?,?)').run(s))

module.exports = { db }
