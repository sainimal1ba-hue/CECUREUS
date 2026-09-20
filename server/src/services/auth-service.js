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
const http = require('http');
const nodemailer = require('nodemailer');
const db = require('../database/pool');
const config = require('../config');
const logger = require('../config/logger');

// Dummy bcrypt hash for timing-attack mitigation on non-existent users
const DUMMY_HASH = '$2b$12$e8YqJ2mO4nS6w8v0x2z4u.K1L3M5N7P9R1T3V5X7Z9B1D3F5H7J9K';

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

  // SMS Phone Verification via SMSIntegra
  if (!identifier.includes('@')) {
    const rawDigits = identifier.replace(/[^0-9]/g, '').trim();
    const mobileNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

    let smsDispatchStatus = 'Pending / Local Fallback';
    const smsConfig = config.sms.smsintegra;

    if (smsConfig.uid && smsConfig.password) {
      try {
        logger.info('Dispatching SMS OTP via SMSIntegra', { to: mobileNumber });

        // CecureUs OTP SMS template (DLT approved)
        const smsMessage = `Use ${code} as one time password (OTP) to login to your CecureUs EAP portal. Valid for 10 minutes.`;

        const now = new Date();
        const dtTimeNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const params = new URLSearchParams({
          uid: smsConfig.uid,
          pwd: String(smsConfig.password),
          mobile: mobileNumber,
          msg: smsMessage,
          sid: smsConfig.senderId,
          type: '0',
          dtTimeNow: dtTimeNow,
          entityid: smsConfig.entityId,
          tempid: smsConfig.otpTemplateId,
        });

        const apiUrl = `${smsConfig.baseUrl}?${params.toString()}`;

        if (!smsConfig.liveEnabled) {
          smsDispatchStatus = 'Simulated (Gateway paused to preserve credits)';
          logger.info('SMSIntegra simulated OTP dispatch (live API paused to preserve credits)', {
            to: mobileNumber,
            code,
          });
        } else {
          const response = await new Promise((resolve, reject) => {
            const req = http.get(apiUrl, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.setTimeout(15000, () => {
              req.destroy();
              reject(new Error('SMSIntegra request timed out after 15s'));
            });
          });

          smsDispatchStatus = `HTTP ${response.statusCode} — ${response.body.trim().substring(0, 100)}`;
          logger.info('SMSIntegra OTP SMS dispatched', {
            to: mobileNumber,
            statusCode: response.statusCode,
            response: response.body.trim().substring(0, 200),
          });
        }
      } catch (smsErr) {
        smsDispatchStatus = `SMSIntegra Error: ${smsErr.message}`;
        logger.warn('SMSIntegra OTP SMS dispatch failed', {
          error: smsErr.message,
          to: mobileNumber,
        });
      }
    }

    // Always log clean SMS banner to terminal for instant developer/admin verification & testing
    console.log('\\n======================================================================');
    console.log('📱 [CECUREUS SMS OTP — SMSINTEGRA]');
    console.log(`👉 Recipient Phone:    ${mobileNumber} (Raw: ${identifier})`);
    console.log(`👉 6-Digit OTP Code:   ${code}`);
    console.log(`👉 Validity:           ${config.otp.expiryMinutes} minutes`);
    console.log(`👉 Purpose:            ${purpose}`);
    console.log(`👉 SMSIntegra Status:  ${smsDispatchStatus}`);
    console.log('======================================================================\\n');
    logger.info('SMS OTP generated for phone', { phone: mobileNumber, devOtpCode: code, otpId: id });
  } else {
    // Gmail Verification -> Dispatched directly to user's Gmail inbox
    // Using the exact CecureUs branded HTML email template provided
    logger.info('Gmail OTP created for email delivery', { email: identifier, otpId: id });

    const MAIN_URL = 'https://www.cecureus.com/';
    const transporter = getEmailTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"CecureUs Support" <${process.env.GMAIL_USER}>`,
          to: identifier,
          subject: 'CecureUs — Email Verification Code',
          html: `
            <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
              <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#fdfdfd" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr><td>
                  <table style="background-color:#fdfdfd;max-width:670px;margin:0 auto;" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                    <tr><td style="height:80px;">&nbsp;</td></tr>
                    <tr>
                      <td style="text-align:left;">
                        <a href="${MAIN_URL}" title="logo" target="_blank">
                          <img width="170" src="https://mljlkjauwvnt.i.optimole.com/JrdXglA-nEdEr7UG/w:auto/h:auto/q:auto/${MAIN_URL}wp-content/uploads/2020/10/CecurusLogoV5-02.png">
                        </a>
                      </td>
                    </tr>
                    <tr><td style="height:20px;">&nbsp;</td></tr>
                    <tr><td>
                      <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                        <tr><td style="height:40px;">&nbsp;</td></tr>
                        <tr><td style="padding:0 35px;">
                          <p style="text-align: left; font-size: 20px;margin: 0; padding: 0 0 35px;">Hello,</p>
                          <h1 style="color:#1e1e2d; text-align:left; font-weight:700; line-height: 30px; margin:0;font-size:20px;">
                            We have received a request for OTP. Please use the below OTP.
                          </h1>
                          <h4 style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #00A99D; margin: 20px 0;">${code}</h4>
                          <p style="color:#455056; text-align: left; padding:0 0 35px; font-size:15px;line-height:24px; margin:0;">OTP will be valid for 10 minutes.</p>
                          <p style="color:#455056; text-align: left; padding:0 0 35px; font-size:15px;line-height:24px; margin:0;">For any support, drop a mail to wellness@cecureus.com</p>
                          <p style="color:#455056; text-align: left; font-size:15px;line-height:24px; margin:0;">
                            Stay Cecure & Well!<br/>
                            Warm Regards,<br/>
                            CecureUs Wellness Team.
                          </p>
                        </td></tr>
                        <tr><td style="height:40px;">&nbsp;</td></tr>
                      </table>
                    </td></tr>
                    <tr><td style="height:20px;">&nbsp;</td></tr>
                    <tr>
                      <td style="text-align:center;">
                        <a href="${MAIN_URL}" title="logo" target="_blank">
                          <img width="130" src="https://mljlkjauwvnt.i.optimole.com/JrdXglA-nEdEr7UG/w:auto/h:auto/q:auto/${MAIN_URL}wp-content/uploads/2020/10/CecurusLogoV5-02.png">
                        </a>
                        <p style="font-size:14px; color:rgba(69, 80, 86, 0.74); line-height:18px; margin:0 0 0;">&copy; <strong>www.cecureus.com</strong></p>
                      </td>
                    </tr>
                    <tr><td style="height:80px;">&nbsp;</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
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
  findAccountByIdentifier,
  findAccountById,
  login,
  deleteAccount,
  createOTP,
  verifyOTP,
};
