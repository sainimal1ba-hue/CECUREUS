/**
 * CECUREUS Database Migration 008 — Ally AI Conversations & Messages Tables
 *
 * Why this file was created:
 * This migration implements persistent storage for user chat sessions with "Ally", the AI mental wellness companion.
 * It was created to power conversational continuity and historical memory for local LLM inference:
 * - `ally_conversations`: Tracks conversation sessions organized by psychological topic (Work Stress, Anxiety, Sleep, Relationships).
 * - `ally_messages`: Stores individual dialogue turns between 'user' and 'ally', enabling multi-turn context retrieval
 *   for the Microsoft Phi-3 / Ollama local AI inference pipeline.
 */
exports.up = async function (conn) {
  await conn.execute(`
    CREATE TABLE ally_conversations (
      id CHAR(36) NOT NULL PRIMARY KEY,
      account_id CHAR(36) NOT NULL,
      topic VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      KEY idx_ally_conv_account (account_id),

      CONSTRAINT fk_ally_conv_account
        FOREIGN KEY (account_id) REFERENCES accounts(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.execute(`
    CREATE TABLE ally_messages (
      id CHAR(36) NOT NULL PRIMARY KEY,
      conversation_id CHAR(36) NOT NULL,
      role ENUM('user', 'ally') NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

      KEY idx_ally_msg_conv (conversation_id),

      CONSTRAINT fk_ally_msg_conv
        FOREIGN KEY (conversation_id) REFERENCES ally_conversations(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

exports.down = async function (conn) {
  await conn.execute('DROP TABLE IF EXISTS ally_messages');
  await conn.execute('DROP TABLE IF EXISTS ally_conversations');
};
