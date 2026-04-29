/**
 * useAuth - Authentication state management composable
 * Manages user sessions, OAuth flows, and data migration
 */

import { ref, computed } from 'vue';
import { api } from '../utils/api.js';

const AUTH_KEY = 'wtpw_auth';
const MIGRATION_KEY = 'wtpw_migrated';

// Raw user state
const _user = ref(null);
const _loading = ref(true);
const _error = ref(null);

// Load persisted auth state
function loadAuth() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      _user.value = data.user || null;
    }
  } catch {
    // Ignore
  }
  _loading.value = false;
}

loadAuth();

export function useAuth() {
  const user = computed(() => _user.value);
  const isLoggedIn = computed(() => !!_user.value);
  const loading = computed(() => _loading.value);
  const error = computed(() => _error.value);

  /**
   * Try to restore session from backend (verifies JWT is still valid)
   */
  async function refreshSession() {
    if (!localStorage.getItem('wtpw_token') && !document.cookie.includes('wtpw_session')) {
      _user.value = null;
      return false;
    }
    try {
      _loading.value = true;
      const data = await api.getMe();
      _user.value = data.user;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: data.user }));
      return true;
    } catch (err) {
      // Token invalid
      _user.value = null;
      localStorage.removeItem('wtpw_token');
      return false;
    } finally {
      _loading.value = false;
    }
  }

  /**
   * Handle OAuth callback - extract token from URL and store session
   */
  async function handleAuthCallback(token) {
    if (!token) return false;
    localStorage.setItem('wtpw_token', token);
    // Also set as cookie for Worker API
    document.cookie = `wtpw_session=${token}; path=/; max-age=${60 * 60 * 24 * 30}`;

    try {
      _loading.value = true;
      const data = await api.getMe();
      _user.value = data.user;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: data.user }));

      // Migrate localStorage data if this is first login
      await migrateLocalStorage();

      return true;
    } catch (err) {
      _error.value = err.message;
      return false;
    } finally {
      _loading.value = false;
    }
  }

  /**
   * Handle magic link callback
   */
  async function handleMagicCallback(token) {
    try {
      _loading.value = true;
      const data = await api.verifyMagicToken(token);
      localStorage.setItem('wtpw_token', data.token);
      document.cookie = `wtpw_session=${data.token}; path=/; max-age=${60 * 60 * 24 * 30}`;
      _user.value = data.user;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: data.user }));
      await migrateLocalStorage();
      return true;
    } catch (err) {
      _error.value = err.message;
      return false;
    } finally {
      _loading.value = false;
    }
  }

  /**
   * Initiate OAuth login flow
   */
  async function loginWithProvider(provider) {
    try {
      _loading.value = true;
      _error.value = null;
      const data = await api.initiateOAuth(provider);
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      _error.value = err.message;
      _loading.value = false;
    }
  }

  /**
   * Initiate magic link email login
   */
  async function loginWithMagicLink(email) {
    try {
      _loading.value = true;
      _error.value = null;
      return await api.initiateOAuth('magic');
    } catch (err) {
      _error.value = err.message;
      return { error: err.message };
    } finally {
      _loading.value = false;
    }
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    }
    _user.value = null;
    _error.value = null;
    localStorage.removeItem('wtpw_token');
    localStorage.removeItem(AUTH_KEY);
    document.cookie = 'wtpw_session=; path=/; max-age=0';
  }

  /**
   * One-time migration of localStorage data to D1 on first login
   */
  async function migrateLocalStorage() {
    if (localStorage.getItem(MIGRATION_KEY)) return;

    const friends = JSON.parse(localStorage.getItem('wtpw_friends') || '[]');
    const hangouts = JSON.parse(localStorage.getItem('wtpw_hangouts') || '[]');

    // Filter out seed data for migration (user data only)
    const userFriends = friends.filter((f) => !f.isSeed);
    const userHangouts = hangouts.filter((h) => !h.isSeed);

    if (userFriends.length === 0 && userHangouts.length === 0) {
      localStorage.setItem(MIGRATION_KEY, '1');
      return;
    }

    try {
      await api.migrateData(userFriends, userHangouts);
      localStorage.setItem(MIGRATION_KEY, '1');
    } catch (err) {
      console.error('Migration failed:', err);
      // Don't block user login if migration fails
    }
  }

  return {
    user,
    isLoggedIn,
    loading,
    error,
    refreshSession,
    handleAuthCallback,
    handleMagicCallback,
    loginWithProvider,
    loginWithMagicLink,
    logout,
  };
}
