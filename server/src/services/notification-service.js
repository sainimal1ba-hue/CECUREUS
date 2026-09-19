/**
 * CECUREUS — Multi-Channel Notification Dispatch Service
 *
 * Why this file was created:
 * When users schedule a therapy consultation, instant confirmations must be dispatched
 * across both mobile SMS (via Twilio Programmable Messaging) and Email (via Gmail SMTP).
 * It sends confidential session confirmations with generated Zoom/meeting links
 * while preserving complete anonymity (masking names and highlighting reference IDs).
 */

const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require('../config');
const logger = require('../config/logger');

// Twilio Programmable SMS client singleton
let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (config.sms.twilioApiKey && config.sms.twilioApiSecret && config.sms.twilioAccountSid) {
    try {
      twilioClient = twilio(config.sms.twilioApiKey, config.sms.twilioApiSecret, {
        accountSid: config.sms.twilioAccountSid,
      });
      logger.info('Twilio SMS client initialized for notifications', { accountSid: config.sms.twilioAccountSid });
    } catch (err) {
      logger.error('Failed to initialize Twilio client for notifications', { error: err.message });
    }
  }

  return twilioClient;
}

// Nodemailer transporter singleton (Gmail SMTP)
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
    logger.info('Gmail SMTP transporter initialized for notifications', { user: gmailUser });
  }

  return emailTransporter;
}

/**
 * Dispatch SMS notification via Twilio
 */
async function sendSMS(toPhone, messageBody) {
  if (!toPhone) return { success: false, reason: 'No phone number provided' };

  const rawDigits = String(toPhone).replace(/[^0-9+]/g, '').trim();
  const formattedPhone = rawDigits.startsWith('+')
    ? rawDigits
    : rawDigits.length === 10
    ? `+91${rawDigits}`
    : `+${rawDigits}`;

  const client = getTwilioClient();
  let dispatchStatus = 'Pending';
  let sid = null;

  if (client) {
    try {
      const smsPayload = {
        body: messageBody,
        to: formattedPhone,
      };

      if (config.sms.twilioPhoneNumber) {
        smsPayload.from = config.sms.twilioPhoneNumber;
      }
      if (config.sms.twilioMessagingServiceSid) {
        smsPayload.messagingServiceSid = config.sms.twilioMessagingServiceSid;
      }

      if (smsPayload.from || smsPayload.messagingServiceSid) {
        const res = await client.messages.create(smsPayload);
        sid = res.sid;
        dispatchStatus = `Sent (${res.status}, SID: ${res.sid})`;
        logger.info('SMS dispatched successfully', { sid: res.sid, to: formattedPhone });
      } else {
        dispatchStatus = 'Twilio Configured (Requires TWILIO_PHONE_NUMBER)';
      }
    } catch (err) {
      dispatchStatus = `Twilio Error: ${err.message}`;
      logger.warn('Twilio SMS dispatch attempt failed', { error: err.message, to: formattedPhone });
    }
  }

  // Developer terminal audit log
  console.log('\n======================================================================');
  console.log('📱 [CECUREUS APPOINTMENT SMS — TWILIO DISPATCH]');
  console.log(`👉 Recipient:   ${formattedPhone}`);
  console.log(`👉 Content:     ${messageBody}`);
  console.log(`👉 Status:      ${dispatchStatus}`);
  if (sid) console.log(`👉 SID:         ${sid}`);
  console.log('======================================================================\n');

  return { success: !!sid, status: dispatchStatus, sid };
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
 * Sends both SMS and Email with meeting Zoom link
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

  // 1. Send SMS Notification
  if (user?.phone) {
    const smsMessage = `CecureUs: Your anonymous ${modeLabel} with ${counsellorName} is confirmed for ${formattedDate} at ${formattedTime} IST. Join Zoom link: ${zoomLink} (Ref: ${referenceCode}). Your identity is 100% confidential.`;
    sendSMS(user.phone, smsMessage).catch(() => {});
  }

  // 2. Send Email Notification
  if (user?.email) {
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
            <h1>CecureUs Consultation Confirmed</h1>
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
              <div class="zoom-title">Your Zoom Meeting Room</div>
              <a href="${zoomLink}" class="zoom-btn" target="_blank">Join Zoom Consultation</a>
              <div class="zoom-link">${zoomLink}</div>
            </div>

            <div class="privacy-note">
              🛡️ <strong>Zero PII Exposure:</strong> No payment details, legal names, or contact data are shared with the clinician.
            </div>
          </div>
          <div class="footer">
            CecureUs Mental Health Platform · 24/7 Helpline: 14416 / 1800-891-4416
          </div>
        </div>
      </body>
      </html>
    `;

    sendEmail({
      to: user.email,
      subject: `CecureUs — Appointment Confirmed with ${counsellorName} (${formattedDate})`,
      html,
      text: `Your anonymous appointment with ${counsellorName} is confirmed for ${formattedDate} at ${formattedTime} IST. Zoom Link: ${zoomLink}`,
    }).catch(() => {});
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  sendAppointmentConfirmation,
};
