/**
 * CECUREUS Database Migration 009 — Push Tokens & Audit Log Tables
 *
 * Why this file was created:
 * This migration establishes push notification device registry and regulatory security audit logging.
 * It was created to provide:
 * - `push_tokens`: Device push tokens (Expo / APNs / FCM) tied to user accounts for session reminders,
 *   crisis alerts, and message notifications.
 * - `audit_log`: Immutable compliance audit trail recording security events (logins, OTP verifications,
 *   password changes, profile updates) with IP addresses and user agents for regulatory compliance.
 */
exports.up = async function (conn) {
  // Push notification device tokens
  await conn.execute(`
    CREATE TABLE push_tokens (
      id CHAR(36) NOT NULL PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      token VARCHAR(500) NOT NULL,
      platform ENUM('ios', 'android') NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY uq_push_token (token),
      KEY idx_push_account (account_id),

      CONSTRAINT fk_push_account
        FOREIGN KEY (account_id) REFERENCES accounts(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Audit log for security-sensitive actions
  await conn.execute(`
    CREATE TABLE audit_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      account_id CHAR(36) DEFAULT NULL,
      action VARCHAR(50) NOT NULL,
      resource VARCHAR(50) DEFAULT NULL,
      resource_id VARCHAR(36) DEFAULT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent VARCHAR(255) DEFAULT NULL,
      details JSON DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      KEY idx_audit_account (account_id),
      KEY idx_audit_action (action),
      KEY idx_audit_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS audit_log');
  await conn.execute('DROP TABLE IF EXISTS push_tokens');
};
