import { buildAppsScriptUrl } from './appScriptConfig';
import { debugLog } from '../utils/debugLog';

const AUTH_SESSION_KEY = 'ducThanhAuthSession';

function readStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function writeStoredSession(session) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession() {
  return readStoredSession();
}

export function getAuthToken() {
  return readStoredSession()?.token || '';
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}

export async function loginWithPassword({ userName, password }) {
  const url = buildAppsScriptUrl('login');
  if (!url) throw new Error('Thiếu URL Apps Script để đăng nhập.');

  const response = await fetch(url.toString(), {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ userName, password }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Sai tài khoản hoặc mật khẩu.');
  }

  const session = {
    token: data.token,
    user: data.user,
    expiresInSeconds: data.expiresInSeconds,
    createdAt: Date.now(),
  };
  writeStoredSession(session);
  return session;
}

export async function verifyStoredSession() {
  const session = readStoredSession();
  // #region agent log
  debugLog({
    hypothesisId: 'H2,H3',
    location: 'src/services/authService.js:verifyStoredSession',
    message: 'Stored session read',
    data: { hasStoredSession: Boolean(session), hasToken: Boolean(session?.token), hasUser: Boolean(session?.user) },
  });
  // #endregion
  if (!session?.token) return null;

  const url = buildAppsScriptUrl('verifySession');
  // #region agent log
  debugLog({
    hypothesisId: 'H3',
    location: 'src/services/authService.js:verifyStoredSession',
    message: 'Verify session URL built',
    data: { hasUrl: Boolean(url), action: url ? url.searchParams.get('action') : '' },
  });
  // #endregion
  if (!url) return null;
  url.searchParams.set('authToken', session.token);

  try {
    const response = await fetch(url.toString(), { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Phiên đăng nhập đã hết hạn.');

    const verifiedSession = {
      ...session,
      user: data.user || session.user,
    };
    writeStoredSession(verifiedSession);
    return verifiedSession;
  } catch (error) {
    // #region agent log
    debugLog({
      hypothesisId: 'H2,H3',
      location: 'src/services/authService.js:verifyStoredSession',
      message: 'Verify session failed',
      data: { errorName: error?.name || '', errorMessage: error?.message || '' },
    });
    // #endregion
    clearAuthSession();
    return null;
  }
}

export async function logoutSession(sessionToken) {
  const token = sessionToken || getAuthToken();
  clearAuthSession();
  if (!token) return;

  const url = buildAppsScriptUrl('logout');
  if (!url) return;

  try {
    await fetch(url.toString(), {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify({ authToken: token }),
    });
  } catch (error) {
    // Local logout is enough for the user; server cache will expire automatically.
  }
}
