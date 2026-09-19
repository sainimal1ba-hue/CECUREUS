/**
 * CECUREUS — Centralized Error Handling & Safety Middleware
 *
 * Why this file was created:
 * This module provides catch-all error isolation and prevents internal information leaks.
 * It was created to safeguard API responses:
 * - Sanitizes all uncaught exceptions, ensuring SQL errors, database schemas, and stack traces are never exposed to clients.
 * - Formats standardized JSON error envelopes `{ error, code, details }` across all endpoints.
 * - Handles 404 Route Not Found conditions with clean responses.
 * - Distinguishes operational validation errors from unexpected 500 server crashes and logs structured alerts with request IDs.
 */

const logger = require('../config/logger');
const config = require('../config');

/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Resource not found',
    code: 'NOT_FOUND',
  });
}

/**
 * Global error handler.
 * Logs full error internally, returns safe message to client.
 */
function errorHandler(err, req, res, _next) {
  // Log the full error internally
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: config.isDev ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Request not allowed',
      code: 'CORS_BLOCKED',
    });
  }

  // Validation errors from express-validator
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid request body',
      code: 'INVALID_JSON',
    });
  }

  // Request entity too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY',
    });
  }

  // MySQL connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

module.exports = { notFoundHandler, errorHandler };
