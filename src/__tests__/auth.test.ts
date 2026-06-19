/**
 * Unit tests for auth-store and token-storage.
 */

// ── SecureStore mock ──────────────────────────────────────────────────────────
const store: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItemAsync: jest.fn((key: string, val: string) => {
    store[key] = val;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete store[key];
    return Promise.resolve();
  }),
}));

import { tokenStorage } from '@/lib/token-storage';
import { useAuthStore } from '@/stores/auth-store';

const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isLoading: true });
});

// ── token-storage ─────────────────────────────────────────────────────────────
describe('tokenStorage', () => {
  test('setTokens stores both tokens; getters retrieve them', async () => {
    await tokenStorage.setTokens('access123', 'refresh456');
    expect(await tokenStorage.getAccessToken()).toBe('access123');
    expect(await tokenStorage.getRefreshToken()).toBe('refresh456');
  });

  test('clearTokens removes both tokens', async () => {
    await tokenStorage.setTokens('a', 'r');
    await tokenStorage.clearTokens();
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });
});

// ── auth-store ────────────────────────────────────────────────────────────────
describe('useAuthStore', () => {
  test('setTokens persists to SecureStore and updates state', async () => {
    await useAuthStore.getState().setTokens('tok', 'ref', mockUser);
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe('tok');
    expect(s.user).toEqual(mockUser);
    expect(await tokenStorage.getAccessToken()).toBe('tok');
    expect(await tokenStorage.getRefreshToken()).toBe('ref');
  });

  test('signOut clears SecureStore and resets state', async () => {
    await useAuthStore.getState().setTokens('tok', 'ref', mockUser);
    await useAuthStore.getState().signOut();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
    expect(await tokenStorage.getAccessToken()).toBeNull();
  });

  test('hydrate with stored token marks isAuthenticated true', async () => {
    await tokenStorage.setTokens('existing', 'ref');
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe('existing');
    expect(s.isLoading).toBe(false);
  });

  test('hydrate without stored token marks isAuthenticated false', async () => {
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.isLoading).toBe(false);
  });

  test('setAccessToken updates state and persists', async () => {
    useAuthStore.getState().setAccessToken('new-token');
    // Small delay to let the async SecureStore.setItemAsync settle
    await new Promise((r) => setTimeout(r, 0));
    expect(useAuthStore.getState().accessToken).toBe('new-token');
    expect(await tokenStorage.getAccessToken()).toBe('new-token');
  });
});
