/**
 * CECUREUS — Authentication & Cryptographic Core Service
 *
 * Why this file was created:
 * This service implements the complete cryptographic, credential management, and multi-factor notification logic.
 * It was created to provide enterprise-grade identity security for all user accounts:
 * - Bcrypt password hashing (configurable work factor 12) with timing-attack mitigation (`DUMMY_HASH` evaluation on missing users).
 * - Cryptographic OTP generation (6-digit integer) with SHA-256 hashed database storage and attempt counting.
 * - Multi-channel OTP dispatch via Nodemailer (Gmail SMTP with branded HTML email templates) and SMS gateway stubs.
 * - Brute-force account lockout protection (`locked_until` threshold after repeated failed attempts).
 * - Stateful bearer session issuance, SHA-256 session token hashing, and multi-device revocation.
 * - Soft-delete account cleanup complying with DPDP and GDPR requirements.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const db = require('../database/pool');
const config = require('../config');
const logger = require('../config/logger');

// Dummy bcrypt hash for timing-attack mitigation on non-existent users
const DUMMY_HASH = '$2b$12$e8YqJ2mO4nS6w8v0x2z4u.K1L3M5N7P9R1T3V5X7Z9B1D3F5H7J9K';

// Twilio Programmable SMS client
let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (config.sms.twilioApiKey && config.sms.twilioApiSecret && config.sms.twilioAccountSid) {
    try {
      twilioClient = twilio(config.sms.twilioApiKey, config.sms.twilioApiSecret, {
        accountSid: config.sms.twilioAccountSid,
      });
      logger.info('Twilio SMS client initialized', { accountSid: config.sms.twilioAccountSid });
    } catch (err) {
      logger.error('Failed to initialize Twilio client', { error: err.message });
    }
  }

  return twilioClient;
}

// Nodemailer transporter (Gmail / SMTP)
let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const gmailUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
  const gmailPass = process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '').trim()
    : null;

  if (gmailUser && gmailPass) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    logger.info('Gmail SMTP transporter initialized', { user: gmailUser });
  }

  return emailTransporter;
}

// ─── PASSWORD OPERATIONS ───────────────────────────────────

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(config.auth.bcryptRounds);
  return bcrypt.hash(plainPassword, salt);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ─── SESSION OPERATIONS ────────────────────────────────────

function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function createSession(accountId, metadata = {}) {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const sessionId = uuidv4();
  const expiresAt = new Date(
    Date.now() + config.auth.tokenExpiryHours * 60 * 60 * 1000
  );

  await db.query(
    `INSERT INTO sessions (id, account_id, token_hash, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      accountId,
      tokenHash,
      metadata.deviceInfo || null,
      metadata.ipAddress || null,
      expiresAt,
    ]
  );

  logger.info('Session created', { accountId, sessionId });

  return {
    id: sessionId,
    token: rawToken,
    expiresAt: expiresAt.toISOString(),
  };
}

async function revokeSession(tokenHash) {
  await db.query(
    'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL',
    [tokenHash]
  );
}

// ─── ACCOUNT OPERATIONS ────────────────────────────────────

async function registerAccount({ name, phone, email, password }) {
  const existing = await findAccountByPhone(phone);
  if (existing) {
    const error = new Error('An account with this phone number already exists');
    error.statusCode = 409;
    error.code = 'ACCOUNT_EXISTS';
    throw error;
  }

  const accountId = uuidv4();
  const passwordHash = password ? await hashPassword(password) : null;

  await db.query(
    `INSERT INTO accounts (id, name, phone, email, password_hash, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [accountId, name, phone, email || null, passwordHash]
  );

  logger.info('Account registered', { accountId, phone });

  return {
    id: accountId,
    name,
    phone,
    email: email || null,
    status: 'active',
  };
}

async function findAccountByPhone(phone) {
  const [rows] = await db.query(
    'SELECT * FROM accounts WHERE phone = ? AND deleted_at IS NULL',
    [phone]
  );
  return rows[0] || null;
}

async function findAccountByIdentifier(identifier) {
  if (!identifier) return null;
  const raw = String(identifier).trim();

  // If email format
  if (raw.includes('@')) {
    const [rows] = await db.query(
      'SELECT * FROM accounts WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
      [raw]
    );
    return rows[0] || null;
  }

  // Normalized phone format
  const digitsOnly = raw.replace(/\D/g, '');
  const tenDigits = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
  const withPlus91 = `+91${tenDigits}`;

  const [rows] = await db.query(
    `SELECT * FROM accounts 
     WHERE (phone = ? OR phone = ? OR phone = ? OR phone = ?) 
       AND deleted_at IS NULL 
     LIMIT 1`,
    [raw, digitsOnly, tenDigits, withPlus91]
  );
  return rows[0] || null;
}

async function findAccountById(id) {
  const [rows] = await db.query(
    'SELECT id, name, phone, email, phone_verified, email_verified, status, created_at FROM accounts WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

async function login(identifier, password, metadata = {}) {
  const account = await findAccountByIdentifier(identifier);

  if (!account) {
    await verifyPassword(password, DUMMY_HASH);
    const error = new Error('Invalid phone number/email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    const error = new Error('Account is temporarily locked due to too many failed attempts. Please try again later.');
    error.statusCode = 423;
    error.code = 'ACCOUNT_LOCKED';
    throw error;
  }

  const isPasswordValid = await verifyPassword(password, account.password_hash);

  if (!isPasswordValid) {
    const failedAttempts = (account.failed_login_attempts || 0) + 1;
    let lockUntil = null;

    if (failedAttempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      logger.warn('Account locked due to consecutive failed logins', { accountId: account.id });
    }

    await db.query(
      'UPDATE accounts SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
      [failedAttempts, lockUntil, account.id]
    );

    const error = new Error('Invalid phone number or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  await db.query(
    'UPDATE accounts SET failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [account.id]
  );

  const session = await createSession(account.id, metadata);

  return {
    account: {
      id: account.id,
      name: account.name,
      phone: account.phone,
      email: account.email,
    },
    session,
  };
}

async function deleteAccount(accountId) {
  return db.transaction(async (conn) => {
    await conn.execute(
      'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE account_id = ? AND revoked_at IS NULL',
      [accountId]
    );

    await conn.execute(
      'UPDATE push_tokens SET is_active = 0 WHERE account_id = ?',
      [accountId]
    );

    await conn.execute(
      `UPDATE accounts SET
        name = 'Deleted User',
        email = NULL,
        phone = CONCAT('deleted_', id),
        password_hash = 'DELETED',
        status = 'deleted',
        deleted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [accountId]
    );

    logger.info('Account deleted', { accountId });
  });
}

// ─── OTP OPERATIONS ────────────────────────────────────────

function generateOTP() {
  if (config.otp.deterministic) {
    return '123456';
  }
  return crypto.randomInt(100000, 999999).toString();
}

function hashOTP(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function createOTP(identifier, purpose) {
  const id = uuidv4();
  const code = generateOTP();
  const codeHash = hashOTP(code);
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  // Invalidate previous unexpired OTPs
  await db.query(
    `UPDATE otp_codes SET expires_at = CURRENT_TIMESTAMP
     WHERE phone = ? AND purpose = ? AND expires_at > CURRENT_TIMESTAMP AND verified_at IS NULL`,
    [identifier, purpose]
  );

  await db.query(
    `INSERT INTO otp_codes (id, phone, code_hash, purpose, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, identifier, codeHash, purpose, expiresAt]
  );

  // SMS Phone Verification via Twilio Programmable Messaging
  if (!identifier.includes('@')) {
    const rawDigits = identifier.replace(/[^0-9+]/g, '').trim();
    const formattedPhone = rawDigits.startsWith('+')
      ? rawDigits
      : rawDigits.length === 10
      ? `+91${rawDigits}`
      : `+${rawDigits}`;

    let twilioDispatchStatus = 'Pending / Local Fallback';
    let twilioSid = null;

    const twilio = getTwilioClient();
    if (twilio) {
      try {
        logger.info('Dispatching SMS OTP via Twilio Programmable Messaging', {
          to: formattedPhone,
          accountSid: config.sms.twilioAccountSid,
        });

        const smsPayload = {
          body: `Your CECUREUS verification code is: ${code}. Valid for ${config.otp.expiryMinutes} minutes. Do not share this OTP with anyone.`,
          to: formattedPhone,
        };

        if (config.sms.twilioPhoneNumber) {
          smsPayload.from = config.sms.twilioPhoneNumber;
        }
        if (config.sms.twilioMessagingServiceSid) {
          smsPayload.messagingServiceSid = config.sms.twilioMessagingServiceSid;
        }

        if (!smsPayload.from && !smsPayload.messagingServiceSid) {
          logger.warn(
            'Twilio SMS notice: No TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID configured yet in .env. Buy a Twilio phone number in Console to dispatch directly over carrier networks.',
            { accountSid: config.sms.twilioAccountSid }
          );
          twilioDispatchStatus = 'Twilio Configured (Requires TWILIO_PHONE_NUMBER in .env)';
        } else {
          const twilioRes = await twilio.messages.create(smsPayload);
          twilioSid = twilioRes.sid;
          twilioDispatchStatus = `Sent (${twilioRes.status}, SID: ${twilioRes.sid})`;
          logger.info('Twilio SMS sent successfully', { sid: twilioRes.sid, status: twilioRes.status, to: formattedPhone });
        }
      } catch (twilioErr) {
        twilioDispatchStatus = `Twilio Error: ${twilioErr.message}`;
        logger.warn('Twilio SMS dispatch attempt failed', {
          error: twilioErr.message,
          code: twilioErr.code,
          moreInfo: twilioErr.moreInfo,
          to: formattedPhone,
        });
      }
    } else if (config.sms.apiKey) {
      // Fallback gateway integration if configured
      try {
        const https = require('https');
        const postData = JSON.stringify({
          route: 'otp',
          variables_values: code,
          numbers: rawDigits.replace(/^\+91/, '').trim(),
        });
        const req = https.request(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            method: 'POST',
            headers: {
              authorization: config.sms.apiKey,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            logger.info('SMS gateway response status', { statusCode: res.statusCode });
          }
        );
        req.on('error', (e) => logger.warn('SMS gateway call failed', { error: e.message }));
        req.write(postData);
        req.end();
      } catch (smsErr) {
        logger.warn('SMS dispatch error', { error: smsErr.message });
      }
    }

    // Always log clean SMS banner to terminal for instant developer/admin verification & testing
    console.log('\n======================================================================');
    console.log('📱 [CECUREUS SMS OTP — TWILIO PROGRAMMABLE SMS]');
    console.log(`👉 Recipient Phone:    ${formattedPhone} (Raw: ${identifier})`);
    console.log(`👉 6-Digit OTP Code:   ${code}`);
    console.log(`👉 Validity:           ${config.otp.expiryMinutes} minutes`);
    console.log(`👉 Purpose:            ${purpose}`);
    console.log(`👉 Twilio Status:      ${twilioDispatchStatus}`);
    if (twilioSid) console.log(`👉 Twilio Message SID: ${twilioSid}`);
    console.log('======================================================================\n');
    logger.info('SMS OTP generated for phone', { phone: formattedPhone, devOtpCode: code, otpId: id });
  } else {
    // Gmail Verification -> Dispatched directly to user's Gmail inbox
    logger.info('Gmail OTP created for email delivery', { email: identifier, otpId: id });

    const transporter = getEmailTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"CecureUs Support" <${process.env.GMAIL_USER}>`,
          to: identifier,
          subject: 'CecureUs — Email Verification Code',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 28px; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0;">
              <h2 style="color: #00A99D; margin-top: 0;">CecureUs Email Verification</h2>
              <p style="color: #475569; font-size: 15px; line-height: 24px;">Your confidential verification code is:</p>
              <div style="background: #F0FDFA; border: 1.5px solid #00A99D; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #00A99D;">${code}</span>
              </div>
              <p style="color: #94A3B8; font-size: 13px;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        logger.info('Verification email dispatched to Gmail', { email: identifier });
      } catch (err) {
        logger.error('Failed to send verification email', { error: err.message });
      }
    }
  }

  return code;
}

async function verifyOTP(identifier, code, purpose) {
  const codeHash = hashOTP(code);

  return db.transaction(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, code_hash, attempts, expires_at
       FROM otp_codes
       WHERE phone = ? AND purpose = ? AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [identifier, purpose]
    );

    if (rows.length === 0) {
      return { valid: false, error: 'No pending verification found' };
    }

    const otp = rows[0];

    if (new Date(otp.expires_at) < new Date()) {
      return { valid: false, error: 'Verification code has expired' };
    }

    if (otp.attempts >= config.otp.maxAttempts) {
      await conn.execute(
        'UPDATE otp_codes SET expires_at = CURRENT_TIMESTAMP WHERE id = ?',
        [otp.id]
      );
      return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Timing-safe comparison
    const isCodeValid = crypto.timingSafeEqual(
      Buffer.from(codeHash, 'hex'),
      Buffer.from(otp.code_hash, 'hex')
    );

    if (!isCodeValid) {
      await conn.execute(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?',
        [otp.id]
      );
      const remainingAttempts = config.otp.maxAttempts - (otp.attempts + 1);
      return {
        valid: false,
        error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      };
    }

    await conn.execute(
      'UPDATE otp_codes SET verified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [otp.id]
    );

    logger.info('OTP successfully verified', { identifier, purpose });
    return { valid: true };
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  revokeSession,
  registerAccount,
  findAccountByPhone,
  findAccountById,
  login,
  deleteAccount,
  createOTP,
  verifyOTP,
};
