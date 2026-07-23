// In-app mailer/SMS — no external gateway. System messages (OTP codes, reset
// links, bill-ready) land in the subscriber's in-app Inbox (messages table).
// This is the in-band oracle for OTP (V1) and reset (V13); also readable across
// subscribers via the inbox IDOR (V5).
let _db = null
function bind(db) { _db = db }
function deliver(subscriberId, { subject, body, system = true, resetToken = null, otp = null }) {
  _db.prepare(`INSERT INTO messages(subscriber_id, folder, subject, body, is_system, reset_token, otp, read, created)
    VALUES (?, 'inbox', ?, ?, ?, ?, ?, 0, datetime('now'))`).run(subscriberId, subject, body, system ? 1 : 0, resetToken, otp)
}
module.exports = { bind, deliver }
