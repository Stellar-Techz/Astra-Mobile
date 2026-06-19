import { create } from 'zustand';
import { tokenStorage } from '@/lib/token-storage';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setTokens: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  setAccessToken: (token: string) => void;
  signOut: () => Promise<void>;
  /** Rehydrate from SecureStore on app launch */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  async setTokens(accessToken, refreshToken, user) {
    await tokenStorage.setTokens(accessToken, refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  setAccessToken(token) {
    tokenStorage.setAccessToken(token);
    set({ accessToken: token });
  },

  async signOut() {
    await tokenStorage.clearTokens();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  async hydrate() {
    const token = await tokenStorage.getAccessToken();
    set({ accessToken: token ?? null, isAuthenticated: !!token, isLoading: false });
  },
}));
