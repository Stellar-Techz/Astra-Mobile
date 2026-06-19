import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOKEN_KEY = 'auth_token';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = {
  id: string;
  email: string;
  name: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthActions = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;
};

export type AuthStore = AuthState & AuthActions;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>((set) => ({
  // initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  signIn: async (credentials: SignInCredentials) => {
    set({ isLoading: true });
    try {
      // Replace with your real API call.
      // Simulated response:
      const token = `mock-jwt-${Date.now()}`;
      const user: User = {
        id: '1',
        email: credentials.email,
        name: 'Demo User',
      };

      await SecureStore.setItemAsync(TOKEN_KEY, token);
      set({ user, token, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshToken: async () => {
    set({ isLoading: true });
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) {
        set({ user: null, token: null, isAuthenticated: false });
        return;
      }

      // Replace with your real token-refresh API call.
      // Re-using the stored token as a stand-in:
      const refreshed = stored;
      await SecureStore.setItemAsync(TOKEN_KEY, refreshed);
      set({ token: refreshed, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },
}));
