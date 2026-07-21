// In-app "mailer" — there is no external SMTP. System mail (welcome, receipts,
// KYC updates, password-reset links) is delivered straight into the player's
// in-app Inbox (the messages table). This is the in-band oracle for the reset
// flow: the reset link lands in the inbox and can be read there.
let _db = null
function bind(db) { _db = db }

function deliver(playerId, { subject, body, system = true, resetToken = null }) {
  _db.prepare(
    `INSERT INTO messages(player_id, folder, subject, body, is_system, reset_token, read, created)
     VALUES (?, 'inbox', ?, ?, ?, ?, 0, datetime('now'))`
  ).run(playerId, subject, body, system ? 1 : 0, resetToken)
}

module.exports = { bind, deliver }
