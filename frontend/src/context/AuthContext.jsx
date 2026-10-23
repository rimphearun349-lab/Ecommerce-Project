"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "auth";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ token: null, user: null });
  const [ready, setReady] = useState(false); // false until the saved session has been read

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAuth(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY); // ignore broken saved data
    }
    setReady(true);
  }, []);

  // authResponse = the JSON returned by POST /api/auth/login: { token, tokenType, expiresInMs, user }
  // (the Spring Boot AuthResponse names the JWT "token")
  const login = useCallback((authResponse) => {
    const next = { token: authResponse.token ?? authResponse.accessToken, user: authResponse.user };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      token: auth.token,
      user: auth.user,
      isAuthenticated: Boolean(auth.token),
      isAdmin: auth.user?.role === "ADMIN",
      login,
      logout,
    }),
    [ready, auth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
