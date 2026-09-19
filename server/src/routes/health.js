/**
 * CECUREUS — Health & Readiness Probe Routes
 *
 * Why this file was created:
 * This module provides unauthenticated liveness and readiness probes for load balancers, Cloudflare tunnels, and container orchestrators.
 * It was created to facilitate uptime monitoring:
 * - `GET /health`: Ultra-lightweight ping returning process status and uptime (used by Cloudflare tunnels and Pingdom).
 * - `GET /ready`: Deep dependency check querying MySQL pool connectivity to verify readiness before routing traffic.
 */

const { Router } = require('express');
const db = require('../database/pool');

const router = Router();

/**
 * Liveness check — lightweight, no external dependencies.
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness check — verifies database connectivity.
 */
router.get('/ready', async (req, res) => {
  try {
    const dbHealthy = await db.healthCheck();

    if (!dbHealthy) {
      return res.status(503).json({
        status: 'not_ready',
        database: 'unavailable',
      });
    }

    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      database: 'error',
    });
  }
});

module.exports = router;
