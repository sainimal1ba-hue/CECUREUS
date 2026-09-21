/**
 * CECUREUS — PM2 Process Manager Ecosystem Configuration
 *
 * Why this file was created:
 * This file configures the enterprise production process manager (PM2) for the CecureUs backend.
 * It was created to ensure continuous zero-downtime reliability:
 * - Runs the Express API in multi-core cluster mode (`instances: 'max'`) across all available CPU cores.
 * - Enforces automatic process resurrection upon uncaught exceptions or crashes.
 * - Configures standardized log routing and log rotation (`./logs/out.log`, `./logs/error.log`).
 * - Manages graceful zero-downtime rolling reloads (`kill_timeout: 30000`) for seamless production updates.
 */

module.exports = {
  apps: [
    {
      name: 'cecureus-api',
      script: 'src/index.js',
      cwd: __dirname,

      // Cluster mode — one process per CPU core
      instances: 'max',
      exec_mode: 'cluster',

      // Environment
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // Auto-restart
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 1000,

      // Graceful shutdown
      kill_timeout: 30000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_type: 'json',

      // Memory limit — restart if exceeded
      max_memory_restart: '500M',

      // Watch (development only)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'tests'],
    },
    {
      name: 'cecureus-tunnel',
      script: 'cloudflared',
      args: process.env.TUNNEL_ARGS || 'tunnel --url http://localhost:3000',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
