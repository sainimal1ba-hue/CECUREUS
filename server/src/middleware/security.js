/**
 * CECUREUS — Comprehensive Security Middleware Stack
 *
 * Why this file was created:
 * This module configures HTTP perimeter defense layers for the backend services.
 * It was created to provide defense-in-depth protection:
 * - Helmet: Injects defensive HTTP security headers (X-Content-Type-Options, Frameguard, HSTS, DNS-Prefetch).
 * - CORS: Dynamic origin validation supporting web portals, mobile app clients, local development, and Cloudflare tunnels.
 * - Compression: Gzip response compression for bandwidth efficiency on mobile networks.
 * - Request Tracing: Injects UUIDv4 `X-Request-Id` headers for end-to-end distributed transaction tracing.
 * - Request Logger: Redacted audit logging of HTTP methods, response codes, latencies, and remote IP addresses.
 */

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../config/logger');

/**
 * Generate a unique request ID for correlation/tracing.
 */
function requestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Request logging — logs method, path, status, duration.
 * NEVER logs request bodies (may contain passwords/OTPs).
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}

/**
 * CORS configuration.
 * In production, only allow specified origins.
 */
function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development, allow all
      if (config.isDev) return callback(null, true);

      // In production, check against allowed origins
      if (config.cors.allowedOrigins.length === 0) {
        // No origins configured — allow all (warn)
        logger.warn('CORS: No ALLOWED_ORIGINS configured, allowing all origins');
        return callback(null, true);
      }

      if (config.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn('CORS: Blocked request from unauthorized origin', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key'],
    maxAge: 86400,
  });
}

/**
 * Combine all security middleware into an array.
 */
function securityMiddleware() {
  return [
    requestId,
    helmet({
      contentSecurityPolicy: false, // API server, not serving HTML
      hsts: config.isProd ? { maxAge: 63072000, includeSubDomains: true } : false,
    }),
    corsMiddleware(),
    compression(),
    requestLogger,
  ];
}

module.exports = { securityMiddleware, requestId, requestLogger };
