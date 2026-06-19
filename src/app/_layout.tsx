import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Redirect, Stack } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OfflineBanner } from '@/components/offline-banner';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useAuthStore } from '@/stores/auth-store';
import { ClipSelectionState } from '@/stores/clips-store';

async function syncClipSelection(_clipId: string, _state: ClipSelectionState) {
  // replaced by real api.patch call once api client is wired through
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const apiFn = useCallback(syncClipSelection, []);
  const isOnline = useNetworkStatus(apiFn);

  const { isAuthenticated, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="clip-editor" options={{ presentation: 'modal' }} />
      </Stack>

      {!isAuthenticated && <Redirect href="/sign-in" />}

      <AnimatedSplashOverlay />
      <AppTabs />
      <OfflineBanner isOnline={isOnline} />
    </ThemeProvider>
  );
}
