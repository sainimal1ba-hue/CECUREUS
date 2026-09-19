/**
 * CECUREUS — Surface Card Container UI Component
 *
 * Why this file was created:
 * This component provides elevated card surfaces matching the soft mint and white aesthetic of the CecureUs design system.
 * It was created with optional pressable touch feedback (`onPress`), border highlights, and soft multi-platform drop shadows.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  bordered = true,
}) => {
  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...(bordered ? { borderWidth: 1, borderColor: colors.borderLight } : {}),
    ...(elevated ? shadows.sm : {}),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={containerStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};
