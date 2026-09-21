/**
 * CECUREUS — Explicit Unverified Session Modal Component
 *
 * Why this file was created:
 * In compliance with Bug 2 fix instructions:
 * When the API is unreachable but the device IS connected to the internet,
 * the app must NOT silently trust an unverified cached session or pretend the user
 * is fully logged in.
 * This modal renders an explicit, non-bypassable state offering:
 * 1. A clear explanation that session verification failed while the phone is online.
 * 2. Displays the target API URL for developer/user clarity.
 * 3. Manual [Retry Verification] action.
 * 4. Explicit [Log Out] action to return cleanly to Login screen.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../config/api';
import { colors, spacing, typography, borderRadius, shadows } from '../../constants/theme';
import { Button } from './Button';

export const UnverifiedSessionModal: React.FC = () => {
  const { isSessionUnverified, sessionVerificationError, retrySessionVerification, logout } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isSessionUnverified) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retrySessionVerification?.();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const activeUrl = getApiBaseUrl();

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Warning Icon Circle */}
          <View style={styles.iconCircle}>
            <Ionicons name="shield-outline" size={32} color="#DC2626" />
          </View>

          <Text style={styles.title}>Can&apos;t verify your session right now</Text>

          <Text style={styles.description}>
            Your device is connected to the internet, but we couldn&apos;t reach the CecureUs server to verify your login credentials.
          </Text>

          {/* Diagnostic Box */}
          <View style={styles.diagnosticBox}>
            <View style={styles.diagRow}>
              <Ionicons name="globe-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.diagLabel}>Server:</Text>
              <Text style={styles.diagValue} numberOfLines={1} ellipsizeMode="middle">
                {activeUrl}
              </Text>
            </View>
            {sessionVerificationError && (
              <Text style={styles.diagError} numberOfLines={2}>
                {sessionVerificationError}
              </Text>
            )}
          </View>

          <Text style={styles.securityNote}>
            🔒 To protect your confidential health data, access to your account is paused until connectivity is verified.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonCol}>
            <Button
              title="Retry Verification"
              variant="primary"
              size="lg"
              fullWidth
              loading={isRetrying}
              disabled={isRetrying || isLoggingOut}
              onPress={handleRetry}
              leftIcon={
                !isRetrying ? (
                  <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : undefined
              }
            />

            <Button
              title="Log Out & Return to Login"
              variant="outline"
              size="md"
              fullWidth
              loading={isLoggingOut}
              disabled={isRetrying || isLoggingOut}
              onPress={handleLogout}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  diagnosticBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: '#475569',
    marginRight: 4,
  },
  diagValue: {
    ...typography.caption,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  diagError: {
    ...typography.caption,
    color: '#EF4444',
    marginTop: 4,
    fontSize: 11,
  },
  securityNote: {
    ...typography.caption,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  buttonCol: {
    width: '100%',
  },
});
