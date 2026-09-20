/**
 * CECUREUS — Multi-Channel Notification Dispatch Service
 *
 * Why this file was created:
 * When users schedule a therapy consultation, instant confirmations must be dispatched
 * across both mobile SMS (via SMSIntegra gateway) and Email (via Gmail SMTP).
 * It sends confidential session confirmations with generated Zoom/meeting links
 * while preserving complete anonymity (masking names and highlighting reference IDs).
 *
 * SMS Integration: SMSIntegra (smsintegra.com)
 * Credentials: uid=cecureustrans, sid=Cecure, entityid=1601205161094588870
 */

const http = require('http');
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../config/logger');

// Nodemailer transporter singleton (Gmail SMTP)
let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const gmailUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : null;
  const gmailPass = process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.replace(/\\s+/g, '').trim()
    : null;

  if (gmailUser && gmailPass) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    logger.info('Gmail SMTP transporter initialized for notifications', { user: gmailUser });
  }

  return emailTransporter;
}

/**
 * Dispatch SMS via SMSIntegra HTTP API
 * API: http://www.smsintegra.com/api/smsapi.aspx?uid=...&pwd=...&mobile=...&msg=...&sid=...&type=0&dtTimeNow=...&entityid=...&tempid=...
 *
 * @param {string} toPhone - Recipient phone number (10 digits or with +91)
 * @param {string} messageBody - SMS content (will be URL-encoded)
 * @param {string} [templateId] - DLT template ID (defaults to OTP template)
 */
async function sendSMS(toPhone, messageBody, templateId) {
  if (!toPhone) return { success: false, reason: 'No phone number provided' };

  // Normalize to 10 digits (Indian mobile)
  const rawDigits = String(toPhone).replace(/[^0-9]/g, '').trim();
  const mobileNumber = rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits;

  const smsConfig = config.sms.smsintegra;

  if (!smsConfig.uid || !smsConfig.password) {
    logger.warn('SMSIntegra not configured (missing UID or password)');

    // Developer terminal audit log
    console.log('\\n======================================================================');
    console.log('📱 [CECUREUS SMS — SMSINTEGRA (NOT CONFIGURED)]');
    console.log(`👉 Recipient:   ${mobileNumber} (Raw: ${toPhone})`);
    console.log(`👉 Content:     ${messageBody}`);
    console.log(`👉 Status:      SMSIntegra credentials missing`);
    console.log('======================================================================\\n');

    return { success: false, reason: 'SMSIntegra not configured' };
  }

  // Build the API URL per the SMSIntegra format provided
  const now = new Date();
  const dtTimeNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const params = new URLSearchParams({
    uid: smsConfig.uid,
    pwd: String(smsConfig.password),
    mobile: mobileNumber,
    msg: messageBody,
    sid: smsConfig.senderId,
    type: '0',
    dtTimeNow: dtTimeNow,
    entityid: smsConfig.entityId,
    tempid: templateId || smsConfig.otpTemplateId,
  });

  const apiUrl = `${smsConfig.baseUrl}?${params.toString()}`;

  // Protect limited SMS credits: Do not make live HTTP calls unless explicitly enabled via SMSINTEGRA_LIVE_ENABLED=true
  if (!smsConfig.liveEnabled) {
    logger.info('SMSIntegra simulated dispatch (live gateway paused to conserve API credits)', {
      to: mobileNumber,
      templateId: templateId || smsConfig.otpTemplateId,
    });

    console.log('\n======================================================================');
    console.log('📱 [CECUREUS SMS — SMSINTEGRA (SAFE MODE — CREDITS PROTECTED)]');
    console.log(`👉 Recipient:   ${mobileNumber} (Raw: ${toPhone})`);
    console.log(`👉 Content:     ${messageBody}`);
    console.log(`👉 Template ID: ${templateId || smsConfig.otpTemplateId}`);
    console.log(`👉 Status:      SIMULATED SUCCESS (Live API call withheld to preserve quota)`);
    console.log(`👉 Live URL:    ${apiUrl}`);
    console.log('======================================================================\n');

    return { success: true, status: 'Simulated (credits protected)', simulated: true };
  }

  let dispatchStatus = 'Pending';

  try {
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

    dispatchStatus = `HTTP ${response.statusCode} — ${response.body.trim().substring(0, 100)}`;
    logger.info('SMSIntegra SMS dispatched', {
      to: mobileNumber,
      statusCode: response.statusCode,
      response: response.body.trim().substring(0, 200),
    });
  } catch (err) {
    dispatchStatus = `SMSIntegra Error: ${err.message}`;
    logger.warn('SMSIntegra SMS dispatch failed', { error: err.message, to: mobileNumber });
  }

  // Developer terminal audit log
  console.log('\\n======================================================================');
  console.log('📱 [CECUREUS SMS — SMSINTEGRA DISPATCH]');
  console.log(`👉 Recipient:   ${mobileNumber} (Raw: ${toPhone})`);
  console.log(`👉 Content:     ${messageBody}`);
  console.log(`👉 Template ID: ${templateId || smsConfig.otpTemplateId}`);
  console.log(`👉 Status:      ${dispatchStatus}`);
  console.log('======================================================================\\n');

  return { success: !dispatchStatus.includes('Error'), status: dispatchStatus };
}

/**
 * Dispatch HTML email via Gmail SMTP
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) return { success: false, reason: 'No email provided' };

  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.warn('Gmail SMTP transporter not configured');
    return { success: false, reason: 'Gmail transporter not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CecureUs Care Team" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html,
    });
    logger.info('Appointment email dispatched successfully', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error('Failed to send appointment confirmation email', { error: err.message, to });
    return { success: false, error: err.message };
  }
}

/**
 * High-level orchestration for appointment confirmation
 * Sends SMS to user, SMS to admin (7200500221), and Email to user
 */
async function sendAppointmentConfirmation({
  user,
  counsellor,
  sessionType,
  scheduledAt,
  durationMinutes = 45,
  zoomLink,
  bookingId,
}) {
  const schedDate = new Date(scheduledAt);
  const formattedDate = schedDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = schedDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const modeLabel =
    sessionType === 'video_call'
      ? 'Video Consultation'
      : sessionType === 'phone_call'
      ? 'Private Phone Call'
      : 'Discreet Live Chat';

  const counsellorName = counsellor?.name || 'Your Assigned Counsellor';
  const referenceCode = `CE-${bookingId ? bookingId.slice(0, 6).toUpperCase() : Math.floor(10000 + Math.random() * 90000)}`;

  // 1. Send SMS to USER via SMSIntegra
  if (user?.phone) {
    const smsMessage = `CecureUs: Your ${modeLabel} with ${counsellorName} is confirmed for ${formattedDate} at ${formattedTime} IST. Join: ${zoomLink} (Ref: ${referenceCode}). 100% confidential.`;
    sendSMS(user.phone, smsMessage).catch(() => {});
  }

  // 2. Send SMS to ADMIN (7200500221) — meeting point #8
  const adminPhone = config.sms.adminNotifyPhone || '7200500221';
  const adminMsg = `New CecureUs Booking: ${modeLabel} with ${counsellorName} on ${formattedDate} at ${formattedTime} IST. Duration: ${durationMinutes}min. Ref: ${referenceCode}.`;
  sendSMS(adminPhone, adminMsg).catch(() => {});

  // 3. Send Email Notification to USER
  if (user?.email) {
    const MAIN_URL = 'https://www.cecureus.com/';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
          .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #00A99D; padding: 24px; text-align: center; }
          .header h1 { color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: #E6F7F5; color: #00877D; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-top: 8px; }
          .body { padding: 28px; }
          .welcome { font-size: 15px; line-height: 24px; color: #475569; margin-bottom: 20px; }
          .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748B; font-weight: 500; }
          .value { color: #0F172A; font-weight: 700; text-align: right; }
          .zoom-box { background: #F0FDFA; border: 1.5px dashed #00A99D; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .zoom-title { font-size: 13px; font-weight: 700; color: #00877D; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .zoom-btn { display: inline-block; background: #00A99D; color: #FFFFFF !important; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 6px; }
          .zoom-link { font-size: 13px; color: #64748B; word-break: break-all; margin-top: 10px; }
          .privacy-note { background: #EFF6FF; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #1E40AF; line-height: 18px; margin-bottom: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${MAIN_URL}" target="_blank">
              <img width="170" src="https://mljlkjauwvnt.i.optimole.com/JrdXglA-nEdEr7UG/w:auto/h:auto/q:auto/${MAIN_URL}wp-content/uploads/2020/10/CecurusLogoV5-02.png" alt="CecureUs">
            </a>
            <h1 style="margin-top:12px;">Consultation Confirmed</h1>
            <span class="badge">100% Anonymous & Confidential</span>
          </div>
          <div class="body">
            <p class="welcome">Your mental wellness appointment is confirmed. The clinician will only identify you via your private reference ID <strong>${referenceCode}</strong>.</p>
            
            <div class="card">
              <div class="row">
                <span class="label">Counsellor</span>
                <span class="value">${counsellorName}</span>
              </div>
              <div class="row">
                <span class="label">Mode</span>
                <span class="value">${modeLabel}</span>
              </div>
              <div class="row">
                <span class="label">Date</span>
                <span class="value">${formattedDate}</span>
              </div>
              <div class="row">
                <span class="label">Time</span>
                <span class="value">${formattedTime} IST</span>
              </div>
              <div class="row">
                <span class="label">Duration</span>
                <span class="value">${durationMinutes} minutes</span>
              </div>
            </div>

            <div class="zoom-box">
              <div class="zoom-title">Your Meeting Room</div>
              <a href="${zoomLink}" class="zoom-btn" target="_blank">Join Consultation</a>
              <div class="zoom-link">${zoomLink}</div>
            </div>

            <p style="color:#455056; text-align:left; font-size:15px; line-height:24px; margin:0 0 20px;">
              For any support, drop a mail to wellness@cecureus.com
            </p>

            <p style="color:#455056; text-align:left; font-size:15px; line-height:24px; margin:0;">
              Stay Cecure & Well!<br/>
              Warm Regards,<br/>
              CecureUs Wellness Team.
            </p>
          </div>
          <div class="footer">
            <a href="${MAIN_URL}" target="_blank">
              <img width="130" src="https://mljlkjauwvnt.i.optimole.com/JrdXglA-nEdEr7UG/w:auto/h:auto/q:auto/${MAIN_URL}wp-content/uploads/2020/10/CecurusLogoV5-02.png" alt="CecureUs">
            </a>
            <p style="font-size:14px; color:rgba(69, 80, 86, 0.74); line-height:18px; margin:8px 0 0;">&copy; <strong>www.cecureus.com</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: user.email,
      subject: `CecureUs — Appointment Confirmed with ${counsellorName} (${formattedDate})`,
      html,
      text: `Your appointment with ${counsellorName} is confirmed for ${formattedDate} at ${formattedTime} IST. Meeting Link: ${zoomLink}. For support: wellness@cecureus.com. Stay Cecure & Well!`,
    }).catch(() => {});
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  sendAppointmentConfirmation,
};
