import { buildAppsScriptUrl } from './appScriptConfig';

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
  if (!session?.token) return null;

  const url = buildAppsScriptUrl('verifySession');
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

export async function changePassword({ currentPassword, newPassword }) {
  const url = buildAppsScriptUrl('changePassword');
  if (!url) throw new Error('Thiếu URL Apps Script để đổi mật khẩu.');

  const response = await fetch(url.toString(), {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({
      authToken: getAuthToken(),
      currentPassword,
      newPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Không đổi được mật khẩu.');
  }

  return data;
}

export async function createUserAccount({ userName, displayName, password, role, active = true }) {
  const url = buildAppsScriptUrl('createUser');
  if (!url) throw new Error('Thiếu URL Apps Script để tạo tài khoản.');

  const response = await fetch(url.toString(), {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({
      authToken: getAuthToken(),
      userName,
      displayName,
      password,
      role,
      active,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error || 'Không tạo được tài khoản.');
  }

  return data.user;
}

export async function fetchUsers() {
  const url = buildAppsScriptUrl('getUsers');
  if (!url) throw new Error('Thiếu URL Apps Script để tải danh sách nhân viên.');
  url.searchParams.set('authToken', getAuthToken());

  const response = await fetch(url.toString(), { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (data?.ok === false) {
    throw new Error(data.error || 'Không tải được danh sách nhân viên.');
  }

  return Array.isArray(data) ? data : data.users || [];
}
