/**
 * CECUREUS — Official Brand Mark & Wordmark Logo Component
 *
 * Why this file was created:
 * This component provides consistent, high-fidelity brand presentation across splash screens, login headers,
 * drawer menus, and navigation headers. It was created to support multiple sizing profiles ('icon', 'horizontal', 'vertical')
 * using the official CecureUs transparent ribbon and dual-tone typography assets.
 */

import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

const LOGO_VERTICAL = require('../../../assets/images/cecureus_logo.png');
const LOGO_HORIZONTAL = require('../../../assets/images/cecureus_logo_horizontal.png');
const LOGO_ICON = require('../../../assets/images/cecureus_icon.png');

export interface LogoProps {
  size?: number;
  variant?: 'icon' | 'horizontal' | 'vertical';
  showText?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 48,
  variant = 'horizontal',
  showText = true,
  style,
  imageStyle,
}) => {
  const isIconOnly = variant === 'icon' || !showText;

  if (isIconOnly) {
    // Aspect ratio of icon mark is 263 x 323 (width:height ~ 0.814)
    const iconHeight = size;
    const iconWidth = Math.round(size * 0.814);

    return (
      <View style={[styles.container, style]}>
        <Image
          source={LOGO_ICON}
          style={[{ width: iconWidth, height: iconHeight }, imageStyle]}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (variant === 'horizontal') {
    // Aspect ratio of horizontal logo is 790 x 180 (width:height ~ 4.39)
    const horizHeight = size;
    const horizWidth = Math.round(size * 4.39);

    return (
      <View style={[styles.container, style]}>
        <Image
          source={LOGO_HORIZONTAL}
          style={[{ width: horizWidth, height: horizHeight }, imageStyle]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Vertical lockup (Icon on top, wordmark below): 512 x 443 (width:height ~ 1.156)
  const vertHeight = size;
  const vertWidth = Math.round(size * 1.156);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={LOGO_VERTICAL}
        style={[{ width: vertWidth, height: vertHeight }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
