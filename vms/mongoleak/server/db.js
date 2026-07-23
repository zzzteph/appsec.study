// MongoLeak seed. Collections held in memory; passwords cleartext (so a blind
// NoSQLi $regex extraction yields a usable password).
const { collection } = require('./mongo')

const usersArr = [
  { _id: 1, username: 'demo', password: 'demo', role: 'user', email: 'demo@notely.test' },
  { _id: 2, username: 'alice', password: 'alicenotes1', role: 'user', email: 'alice@notely.test' },
  { _id: 3, username: 'bob', password: 'bobsecret22', role: 'user', email: 'bob@notely.test' },
  { _id: 4, username: 'admin', password: 'S3cr3tAdm1nX', role: 'admin', email: 'admin@notely.test' },
]
const notesArr = [
  { _id: 1, owner: 'demo', title: 'Shopping list', body: 'milk, eggs, bread', private: false },
  { _id: 2, owner: 'demo', title: 'Ideas', body: 'app idea: notes with sync', private: false },
  { _id: 3, owner: 'alice', title: 'Bank PIN', body: 'ATM pin is 4471 (do not share)', private: true },
  { _id: 4, owner: 'alice', title: 'Passwords', body: 'email: alice / Hunter2!  · vpn: alice.vpn', private: true },
  { _id: 5, owner: 'bob', title: 'Server creds', body: 'prod root pw: Pr0dR00t!  · db: mongodb://bob:pw@db', private: true },
  { _id: 6, owner: 'admin', title: 'Master key', body: 'recovery seed: alpha-bravo-charlie-delta', private: true },
]
const users = collection(usersArr)
const notes = collection(notesArr)
module.exports = { users, notes }
