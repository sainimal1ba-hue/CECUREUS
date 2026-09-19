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

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const ACTIVE_CLOUDFLARE_TUNNEL = 'https://pressed-prompt-earliest-informed.trycloudflare.com';
export const LOCAL_LAN_IP = '192.168.1.8';
export const DEFAULT_PORT = 3000;

function getExpoHostIp(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).linkingUri;

  if (hostUri && typeof hostUri === 'string') {
    const clean = hostUri.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
    const host = clean.split(':')[0];
    const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
    if (isIpv4 && host !== '127.0.0.1' && host !== 'localhost') {
      return host;
    }
  }
  return null;
}

export function resolveConfiguredApiUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

  // 1. If explicitly configured with an external/tunnel/production URL (non-localhost), use it directly
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. On Web browsers, localhost is valid and connects to the developer machine
  if (Platform.OS === 'web') {
    return envUrl ? envUrl.replace(/\/$/, '') : `http://localhost:${DEFAULT_PORT}`;
  }

  // 3. On physical mobile devices (Android / iOS):
  // "localhost" / "127.0.0.1" refers to the phone itself, causing socket ConnectException.
  // Prioritize the active Cloudflare Tunnel (reachable across cellular 5G and Wi-Fi)
  if (ACTIVE_CLOUDFLARE_TUNNEL) {
    return ACTIVE_CLOUDFLARE_TUNNEL;
  }

  // 4. Fallback: extract the laptop LAN IP from Expo's Metro hostUri or fallback to local subnet
  const host = getExpoHostIp() || LOCAL_LAN_IP;
  return `http://${host}:${DEFAULT_PORT}`;
}

export function getFallbackApiUrl(): string | null {
  const current = resolveConfiguredApiUrl();
  // If currently using Cloudflare tunnel, local Wi-Fi LAN IP is a high-speed local fallback
  if (current.includes('trycloudflare.com')) {
    const host = getExpoHostIp() || LOCAL_LAN_IP;
    return `http://${host}:${DEFAULT_PORT}`;
  }
  // If currently using LAN IP, Cloudflare tunnel is the internet-wide fallback
  if (ACTIVE_CLOUDFLARE_TUNNEL && !current.includes('trycloudflare.com')) {
    return ACTIVE_CLOUDFLARE_TUNNEL;
  }
  return null;
}

export const API_BASE_URL = resolveConfiguredApiUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

