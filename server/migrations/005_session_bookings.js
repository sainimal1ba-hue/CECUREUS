/**
 * CECUREUS Database Migration 005 — Session Bookings Table
 *
 * Why this file was created:
 * This migration manages scheduled therapy appointments between users and verified mental health counsellors.
 * It was created to power the appointment management and profile session history:
 * - Supports multiple delivery modes ('video_call', 'phone_call', 'chat').
 * - Lifecycle state transitions ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled').
 * - Links patient accounts to assigned counsellors via foreign keys with cascade safety.
 * - Stores clinical session summaries, pre-session notes, and discussion topics for longitudinal patient care.
 */
exports.up = async function (conn) {
  await conn.execute(`
    CREATE TABLE session_bookings (
      id CHAR(36) NOT NULL PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      counsellor_id CHAR(36) NOT NULL,
      session_type ENUM('video_call', 'phone_call', 'chat') NOT NULL,
      status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      scheduled_at TIMESTAMP NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 60,
      topics JSON DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      summary TEXT DEFAULT NULL,
      cancelled_at TIMESTAMP NULL DEFAULT NULL,
      cancel_reason VARCHAR(255) DEFAULT NULL,
      idempotency_key VARCHAR(64) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      KEY idx_bookings_account (account_id),
      KEY idx_bookings_counsellor (counsellor_id),
      KEY idx_bookings_status (status),
      KEY idx_bookings_scheduled (scheduled_at),
      UNIQUE KEY uq_bookings_idempotency (idempotency_key),

      CONSTRAINT fk_bookings_account
        FOREIGN KEY (account_id) REFERENCES accounts(id)
        ON DELETE CASCADE,

      CONSTRAINT fk_bookings_counsellor
        FOREIGN KEY (counsellor_id) REFERENCES counsellors(id)
        ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS session_bookings');
};
