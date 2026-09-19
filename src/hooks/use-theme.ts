/**
 * CECUREUS — Theme Palette Selector Hook
 *
 * Why this file was created:
 * This custom hook provides direct access to the current theme palette (Colors[theme]) matching
 * the user's active device mode (light or dark), providing automatic fallback to 'light' for unspecified modes.
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}
