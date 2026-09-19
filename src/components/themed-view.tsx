/**
 * CECUREUS — Themed Background View Container
 *
 * Why this file was created:
 * This component provides theme-reactive container background colors, ensuring views automatically
 * adapt between dark and light surface colors according to user preferences or system schemes.
 */

import { View, type ViewProps } from 'react-native';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
