import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthSession, getAuthSession, loginWithPassword, logoutSession, verifyStoredSession } from '../services/authService';
import { debugLog } from '../utils/debugLog';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getAuthSession());
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      // #region agent log
      debugLog({
        hypothesisId: 'H2',
        location: 'src/context/AuthContext.jsx:verifySession',
        message: 'Auth session verification started',
        data: {},
      });
      // #endregion
      const verifiedSession = await verifyStoredSession();
      if (!isMounted) return;
      setSession(verifiedSession);
      setIsCheckingSession(false);
      // #region agent log
      debugLog({
        hypothesisId: 'H2',
        location: 'src/context/AuthContext.jsx:verifySession',
        message: 'Auth session verification completed',
        data: { hasVerifiedSession: Boolean(verifiedSession), hasUser: Boolean(verifiedSession?.user) },
      });
      // #endregion
    }

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async ({ userName, password }) => {
    const nextSession = await loginWithPassword({ userName, password });
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    const previousSession = session;
    setSession(null);
    clearAuthSession();
    if (previousSession?.token) {
      await logoutSession(previousSession.token);
    }
  }, [session]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isAuthenticated: Boolean(session?.token),
    isCheckingSession,
    login,
    logout,
  }), [isCheckingSession, login, logout, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
