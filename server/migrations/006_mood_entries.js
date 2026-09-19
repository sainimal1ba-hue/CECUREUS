/**
 * CECUREUS Database Migration 006 — Mood Entries Table
 *
 * Why this file was created:
 * This migration implements the emotional wellness journaling and mood tracking telemetry.
 * It was created to back the interactive mood selector on the Dashboard / Home screen:
 * - Categorizes emotional states ('great', 'good', 'okay', 'low', 'bad').
 * - Stores optional reflective user notes explaining their feelings.
 * - Indexed by `account_id` and `created_at` for chronological mood trend analysis and visualization.
 */
exports.up = async function (conn) {
  await conn.execute(`
    CREATE TABLE mood_entries (
      id CHAR(36) NOT NULL PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      mood ENUM('great', 'good', 'okay', 'low', 'bad') NOT NULL,
      note TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      KEY idx_mood_account (account_id),
      KEY idx_mood_created (created_at),

      CONSTRAINT fk_mood_account
        FOREIGN KEY (account_id) REFERENCES accounts(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS mood_entries');
};
