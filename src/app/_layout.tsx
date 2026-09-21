/**
 * CECUREUS — Root Application Layout & Authentication Routing Guard
 *
 * Why this file was created:
 * This is the top-level layout component for the entire Expo Router navigation tree.
 * It was created to provide essential application-wide infrastructure:
 * - Wraps the app in `SafeAreaProvider` and `AuthProvider` to provide global theme and session context.
 * - Enforces reactive authentication routing guards: automatically redirects unauthenticated users to `/login`
 *   and authenticated users away from the auth group into `/(tabs)`.
 * - Manages native splash screen hiding lifecycle after session restoration completes.
 * - Configures root stack navigation transitions (headerless modal presentations for assessment, counsellor, and chat).
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NetworkErrorBanner } from '../components/ui/NetworkErrorBanner';
import { DevApiBanner } from '../components/ui/DevApiBanner';
import { UnverifiedSessionModal } from '../components/ui/UnverifiedSessionModal';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isPublicLegal = segments[0] === 'privacy' || segments[0] === 'terms';

    if (!isAuthenticated && !inAuthGroup && !isPublicLegal) {
      // Direct unauthenticated user to Login screen first
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Direct authenticated user to Home screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/otp" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="terms" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="counsellor/[id]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="assessment/[id]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="blogs/index" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NetworkErrorBanner />
        <DevApiBanner />
        <UnverifiedSessionModal />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
