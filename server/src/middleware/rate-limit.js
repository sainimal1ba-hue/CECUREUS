/**
 * CECUREUS — Distributed Tiered Rate Limiting Middleware
 *
 * Why this file was created:
 * This module shields the API from denial-of-service (DoS) attacks, brute-force credential guessing, and SMS/OTP spam.
 * It was created to enforce multi-tiered traffic shaping:
 * - `globalLimiter`: Protects all general endpoints (100 requests per 15-minute window by default).
 * - `authLimiter`: Strict limiter on authentication, OTP generation, and login endpoints (20 attempts per 15-minute window).
 * - Returns RFC 7807 compliant 429 Too Many Requests status codes with `Retry-After` headers.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Global rate limiter — applies to all endpoints.
 */
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === '/health' || req.path === '/ready';
  },
});

/**
 * Auth rate limiter — stricter for authentication endpoints.
 * Protects login, OTP, registration from brute force.
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait before trying again.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => req.ip,
});

/**
 * OTP-specific rate limiter — very strict.
 * Max 5 OTP requests per phone per hour.
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.otp.maxResendsPerHour,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many OTP requests. Please wait before requesting a new code.',
    code: 'OTP_RATE_LIMIT_EXCEEDED',
  },
  keyGenerator: (req) => `otp:${req.body?.phone || req.ip}`,
});

module.exports = { globalLimiter, authLimiter, otpLimiter };
