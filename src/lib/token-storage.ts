import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
} as const;

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(KEYS.accessToken),
  setAccessToken: (token: string) => SecureStore.setItemAsync(KEYS.accessToken, token),

  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token),

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    ]);
  },

  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]);
  },
};
