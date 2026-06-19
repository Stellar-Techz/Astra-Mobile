import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Handles the deep-link: clipcash://auth/callback?token=...
 * expo-router maps the query params automatically via useLocalSearchParams.
 */
export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in');
      return;
    }

    api
      .post<{ accessToken: string; refreshToken: string; user: { id: string; email: string; name?: string } }>(
        '/auth/magic-link/verify',
        { token },
      )
      .then(({ data }) => {
        setTokens(data.accessToken, data.refreshToken, data.user).then(() =>
          router.replace('/(tabs)/'),
        );
      })
      .catch(() => router.replace('/sign-in'));
  }, [token]);

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
