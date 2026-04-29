/**
 * API client for 找谁玩 backend
 * Handles auth-aware requests to the Cloudflare Worker API
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'https://who-to-play-with.ljding94.workers.dev';

function getSessionToken() {
  try {
    const cookies = document.cookie.split(';').reduce((acc, pair) => {
      const [key, val] = pair.trim().split('=');
      acc[key] = val;
      return acc;
    }, {});
    return cookies['wtpw_session'] || localStorage.getItem('wtpw_token');
  } catch {
    return localStorage.getItem('wtpw_token');
  }
}

async function request(method, path, body = null, useAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getSessionToken();
  if (useAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  // Handle CORS
  if (res.status === 0 || res.type === 'opaque') {
    // CORS error - try with credentials
    const res2 = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
    });
    if (!res2.ok) {
      const err = await res2.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res2.status}`);
    }
    return res2.json();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async initiateOAuth(provider) {
    return request('POST', `/api/auth/${provider}`, null, false);
  },

  async getMe() {
    return request('GET', '/api/auth/me');
  },

  async logout() {
    localStorage.removeItem('wtpw_token');
    return request('POST', '/api/auth/logout');
  },

  async verifyMagicToken(token) {
    return request('POST', '/api/auth/callback/magic', { token }, false);
  },

  // Friends
  async getFriends() {
    return request('GET', '/api/friends');
  },

  async createFriend(data) {
    return request('POST', '/api/friends', data);
  },

  async updateFriend(id, data) {
    return request('PUT', `/api/friends/${id}`, data);
  },

  async deleteFriend(id) {
    return request('DELETE', `/api/friends/${id}`);
  },

  // Hangouts
  async getHangouts() {
    return request('GET', '/api/hangouts');
  },

  async createHangout(data) {
    return request('POST', '/api/hangouts', data);
  },

  async updateHangout(id, data) {
    return request('PUT', `/api/hangouts/${id}`, data);
  },

  async deleteHangout(id) {
    return request('DELETE', `/api/hangouts/${id}`);
  },

  // Data migration
  async migrateData(friends, hangouts) {
    return request('POST', '/api/data/migrate', { friends, hangouts });
  },
};
