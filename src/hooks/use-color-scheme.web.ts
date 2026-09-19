import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * CECUREUS — Color Scheme Hydration Hook (Web Platform)
 *
 * Why this file was created:
 * In Server-Side Rendering (SSR) or static site generation (SSG) for Expo Web, reading the system color scheme
 * before client hydration causes React hydration mismatches between server-rendered HTML and client DOM.
 * This hook guarantees hydration consistency by defaulting to 'light' until mounted on the web browser.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
