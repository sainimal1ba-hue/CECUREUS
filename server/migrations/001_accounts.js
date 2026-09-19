/**
 * CECUREUS Database Migration 001 — Accounts Table
 *
 * Why this file was created:
 * This migration defines the core user identity and credentials table for the CecureUs platform.
 * It was created to provide a secure, scalable account repository supporting:
 * - UUIDv4 primary keys for distributed security (preventing sequential ID enumeration).
 * - Multi-factor identity with unique phone numbers and email addresses.
 * - Argon2/Bcrypt password hash storage.
 * - Brute-force protection tracking (`failed_login_attempts`, `locked_until`).
 * - Soft-delete capability (`deleted_at`) for GDPR/DPDP privacy compliance.
 * - Real-time verification flags for phone and email.
 */
exports.up = async function (conn) {
  await conn.execute(`
    CREATE TABLE accounts (
      id CHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      phone_verified TINYINT(1) NOT NULL DEFAULT 0,
      failed_login_attempts INT NOT NULL DEFAULT 0,
      locked_until TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,

      UNIQUE KEY uq_accounts_phone (phone),
      UNIQUE KEY uq_accounts_email (email),
      KEY idx_accounts_status (status),
      KEY idx_accounts_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS accounts');
};
