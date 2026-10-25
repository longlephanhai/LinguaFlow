const API_BASE_URL = 'http://localhost:3000';

interface StorageData {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

async function getStoredTokens(): Promise<StorageData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'user'], (res) => {
      resolve(res);
    });
  });
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;
    const body = await res.json();
    const token = body.data?.accessToken || body.accessToken;
    if (token) {
      await chrome.storage.local.set({ accessToken: token });
      return token;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let { accessToken, refreshToken } = await getStoredTokens();

  if (!accessToken) {
    throw new Error('UNAUTHORIZED');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && refreshToken) {
    const newToken = await refreshAccessToken(refreshToken);
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  return res;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { action, payload } = message;

  if (action === 'GET_AUTH_STATUS') {
    getStoredTokens().then((data) => {
      sendResponse({
        isAuthenticated: !!data.accessToken,
        user: data.user || null,
      });
    });
    return true;
  }

  if (action === 'LOGIN') {
    fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(async (body) => {
        if (body.success && body.data) {
          await chrome.storage.local.set({
            accessToken: body.data.accessToken,
            refreshToken: body.data.refreshToken,
            user: body.data.user,
          });
          sendResponse({ success: true, user: body.data.user });
        } else {
          sendResponse({
            success: false,
            error: body.error?.message || 'Login failed',
          });
        }
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (action === 'LOGOUT') {
    getStoredTokens().then(async ({ accessToken }) => {
      if (accessToken) {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }).catch(() => {});
      }
      await chrome.storage.local.remove(['accessToken', 'refreshToken', 'user']);
      sendResponse({ success: true });
    });
    return true;
  }

  if (action === 'LOOKUP_WORD') {
    authenticatedFetch('/vocabulary/lookup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.success && body.data) {
          sendResponse({ success: true, data: body.data });
        } else {
          sendResponse({
            success: false,
            error: body.error?.message || 'Lookup failed',
          });
        }
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err.message === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : err.message,
        });
      });
    return true;
  }

  if (action === 'SAVE_OCCURRENCE') {
    authenticatedFetch('/vocabulary/occurrences', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          sendResponse({ success: true, data: body.data });
        } else {
          sendResponse({
            success: false,
            error: body.error?.message || 'Save failed',
          });
        }
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err.message === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : err.message,
        });
      });
    return true;
  }

  return false;
});
