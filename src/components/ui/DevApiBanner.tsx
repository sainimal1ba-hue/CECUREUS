/**
 * CECUREUS — Dev-Only Active API Diagnostic Banner
 *
 * Why this file was created:
 * When testing on different Wi-Fi/cellular networks or tunnels, hardcoded or stale
 * tunnel URLs often lead to mysterious "Unable to connect" alerts.
 * This banner is rendered ONLY during `__DEV__` mode, prominently showing:
 * 1. The active API Base URL loaded by the client.
 * 2. Instant visual reachability indicator (Green = reachable, Red = unreachable, Grey = checking).
 * 3. Quick tap to re-ping `/health` with latency display.
 * 4. Ability to minimize so it does not interfere with screen testing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../../config/api';

export const DevApiBanner: React.FC = () => {
  if (!__DEV__) return null;

  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const activeUrl = getApiBaseUrl();

  const pingServer = useCallback(async () => {
    setStatus('checking');
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${activeUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setLatency(Date.now() - start);
        setStatus('connected');
      } else {
        setStatus('error');
        setLatency(null);
      }
    } catch {
      setStatus('error');
      setLatency(null);
    }
  }, [activeUrl]);

  useEffect(() => {
    pingServer();
    // Re-check periodically every 30s in dev
    const interval = setInterval(pingServer, 30000);
    return () => clearInterval(interval);
  }, [pingServer]);

  const dotColor =
    status === 'connected' ? '#10B981' : status === 'error' ? '#EF4444' : '#F59E0B';

  if (isMinimized) {
    return (
      <TouchableOpacity
        style={[
          styles.minimizedContainer,
          { top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 10) + 4 },
        ]}
        onPress={() => setIsMinimized(false)}
        activeOpacity={0.85}
        accessibilityLabel="Show Dev API Diagnostics"
      >
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={styles.minimizedText} numberOfLines={1}>
          API: {activeUrl.replace(/^https?:\/\//, '')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.expandedContainer,
        { top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 10) + 4 },
      ]}
    >
      <View style={styles.expandedHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <Text style={styles.expandedTitle}>DEV API Diagnostics</Text>
          <Text
            style={[
              styles.statusPill,
              status === 'connected'
                ? styles.statusPillSuccess
                : status === 'error'
                ? styles.statusPillError
                : styles.statusPillPending,
            ]}
          >
            {status === 'connected'
              ? `Connected (${latency}ms)`
              : status === 'error'
              ? 'Unreachable'
              : 'Checking...'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={pingServer} style={styles.actionBtn}>
            <Ionicons name="refresh" size={14} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsMinimized(true)}
            style={[styles.actionBtn, { marginLeft: 6 }]}
          >
            <Ionicons name="chevron-up" size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.urlDisplay} numberOfLines={1} selectable>
        Target: {activeUrl}
      </Text>

      {status === 'error' && (
        <Text style={styles.warningHint}>
          Tunnel or server is unreachable. Check EXPO_PUBLIC_API_URL in .env and restart Expo.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  minimizedContainer: {
    position: 'absolute',
    right: 12,
    zIndex: 99998,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    maxWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  minimizedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  expandedContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99998,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    marginRight: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPill: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34D399',
  },
  statusPillError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#F87171',
  },
  statusPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#FBBF24',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },
  urlDisplay: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  warningHint: {
    fontSize: 10,
    color: '#FCA5A5',
    marginTop: 4,
    lineHeight: 14,
  },
});
