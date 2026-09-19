/**
 * CECUREUS — Centralized Modular API Network Configuration
 *
 * Why this file was created:
 * In a distributed hybrid architecture (mobile clients on cellular/Wi-Fi and backend
 * hosted either via a Cloudflare Tunnel or a dedicated production VPS), hardcoding
 * localhost, 127.0.0.1, or local subnet IPs causes mobile socket connection failures
 * (such as Android ConnectException: Failed to connect to /127.0.0.1:3000).
 *
 * This module provides the single source of truth for the API base URL:
 * - Reads directly from process.env.EXPO_PUBLIC_API_URL.
 * - Switching from immediate Cloudflare Tunnel testing to a permanent dedicated VPS
 *   requires editing ONLY the single line in .env (no code changes needed):
 *
 *   Immediate Cloudflare Tunnel:
 *   EXPO_PUBLIC_API_URL=https://<your-tunnel-subdomain>.trycloudflare.com
 *
 *   Future Dedicated Server:
 *   EXPO_PUBLIC_API_URL=https://api.yourdomain.com
 */

function resolveConfiguredApiUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  // Fallback if env variable is absent: warn and provide standard placeholder
  return 'http://localhost:3000';
}

export const API_BASE_URL = resolveConfiguredApiUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
