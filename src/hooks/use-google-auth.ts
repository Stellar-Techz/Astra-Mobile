import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export function useGoogleAuth() {
  const setTokens = useAuthStore((s) => s.setTokens);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'clipcash', path: 'auth/callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;

    const { code } = response.params;
    api
      .post<{ accessToken: string; refreshToken: string; user: { id: string; email: string; name?: string } }>(
        '/auth/google',
        { code, codeVerifier: request?.codeVerifier, redirectUri },
      )
      .then(({ data }) => setTokens(data.accessToken, data.refreshToken, data.user))
      .catch(console.error);
  }, [response]);

  return { promptAsync, request };
}
