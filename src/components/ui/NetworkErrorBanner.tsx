/**
 * CECUREUS — In-App Global Network Error Banner Component
 *
 * Why this file was created:
 * This component intercepts offline, socket, and gateway timeout conditions across the
 * entire application, presenting a non-intrusive, reassuring banner to distressed users
 * instead of raw system stack traces.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { networkEvents } from '../../services/networkEvents';
import { colors, typography, spacing, borderRadius, shadows } from '../../constants/theme';

export const NetworkErrorBanner: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubError = networkEvents.subscribeError((msg) => {
      setErrorMessage(msg);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    });

    const unsubClear = networkEvents.subscribeClear(() => {
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setErrorMessage(null));
    });

    return () => {
      unsubError();
      unsubClear();
    };
  }, [slideAnim]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setErrorMessage(null));
  };

  if (!errorMessage) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 12),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Connection Alert</Text>
          <Text style={styles.message} numberOfLines={2}>
            {errorMessage}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 99999,
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  message: {
    ...typography.caption,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  closeBtn: {
    marginLeft: spacing.sm,
    padding: 4,
  },
});
