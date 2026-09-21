/**
 * CECUREUS — Centralized Modular API Network Configuration
 *
 * Why this file was updated:
 * Previously, an unstable Cloudflare Quick Tunnel URL was hardcoded in this file,
 * causing silent network failure on any Wi-Fi or cellular network when that ephemeral
 * tunnel died.
 *
 * This module now enforces best practices:
 * 1. Strictly reads the primary API URL from `process.env.EXPO_PUBLIC_API_URL` in `.env`.
 * 2. Zero hardcoded Quick Tunnel URLs in source code.
 * 3. Provides clean fallbacks for local dev (web localhost and detected LAN IP).
 * 4. Exposes runtime getters and inspection helpers for dev diagnostics.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const DEFAULT_PORT = 3000;
// Current local LAN IP fallback (when testing locally on the same Wi-Fi)
export const LOCAL_LAN_IP = '10.50.7.65';

/**
 * Extracts the dev machine host IP from Expo's Metro bundler hostUri.
 */
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

/**
 * Resolves the active API base URL.
 * Strictly prioritizes `EXPO_PUBLIC_API_URL` from `.env`.
 */
export function resolveConfiguredApiUrl(): string {
  const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

  // 1. Explicitly configured in .env (named tunnel, production domain, or local IP)
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. On Web browsers, localhost connects to dev server on current machine
  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  // 3. Fallback for physical mobile devices / emulators when EXPO_PUBLIC_API_URL is omitted:
  // Dynamically resolve laptop LAN IP from Expo Metro hostUri or fallback to LOCAL_LAN_IP
  const detectedHost = getExpoHostIp() || LOCAL_LAN_IP;
  if (__DEV__) {
    console.warn(
      `[API Config] EXPO_PUBLIC_API_URL is not set in .env. Falling back to local LAN: http://${detectedHost}:${DEFAULT_PORT}`
    );
  }
  return `http://${detectedHost}:${DEFAULT_PORT}`;
}

/**
 * Fallback URL logic — no hardcoded tunnels.
 * Returns null unless an explicit secondary fallback is needed.
 */
export function getFallbackApiUrl(): string | null {
  return null;
}

export const API_BASE_URL = resolveConfiguredApiUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
