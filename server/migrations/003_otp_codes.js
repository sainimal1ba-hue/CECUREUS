/**
 * CECUREUS Database Migration 003 — OTP Codes Table
 *
 * Why this file was created:
 * This migration implements time-based one-time password (OTP) verification for telephone and email authentication.
 * It was created to provide banking-grade security for the login and registration flows:
 * - Stores SHA-256 hashes of generated 6-digit OTP codes rather than plaintext.
 * - Tracks attempt counters to lock out brute-force guessing after max attempts (e.g. 5 tries).
 * - Enforces strict expiration timestamps (default 15 minutes).
 * - Segregates codes by cryptographic purpose ('registration', 'login', 'password_reset') to prevent replay attacks.
 */
exports.up = async function (conn) {
  await conn.execute(`
    CREATE TABLE otp_codes (
      id CHAR(36) NOT NULL PRIMARY KEY,
      phone VARCHAR(191) NOT NULL,
      code_hash VARCHAR(64) NOT NULL,
      purpose ENUM('registration', 'login', 'password_reset') NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      verified_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      KEY idx_otp_phone_purpose (phone, purpose),
      KEY idx_otp_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS otp_codes');
};
