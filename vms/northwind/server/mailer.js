// In-app mailer — no external SMTP. System mail (statements ready, transfer
// receipts, password-reset links) is delivered into the customer's in-app Inbox.
// This is the in-band oracle for the reset flow (V4) — the reset link lands here
// and is also readable across customers via the inbox IDOR (V5).
let _db = null
function bind(db) { _db = db }
function deliver(customerId, { subject, body, system = true, resetToken = null }) {
  _db.prepare(`INSERT INTO messages(customer_id, folder, subject, body, is_system, reset_token, read, created)
    VALUES (?, 'inbox', ?, ?, ?, ?, 0, datetime('now'))`).run(customerId, subject, body, system ? 1 : 0, resetToken)
}
module.exports = { bind, deliver }
