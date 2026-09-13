import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authApi } from '../services/api';

// Create Auth Context
const AuthContext = createContext(null);

const clearStoredSession = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

const validUser = (user) => user &&
  ['SuperAdmin', 'ContentEditor'].includes(user.role) &&
  Number.isFinite(Date.parse(user.expiresAt)) && Date.parse(user.expiresAt) > Date.now();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const operation = useRef(0);

  useEffect(() => {
    let active = true;
    const clearSession = () => {
      operation.current += 1;
      clearStoredSession();
      setUser(null);
      setToken(null);
    };
    const restore = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        clearSession();
        setLoading(false);
        return;
      }
      try {
        const restoredUser = await authApi.getSession();
        if (!validUser(restoredUser)) throw new Error('Invalid session');
        if (active && localStorage.getItem('authToken') === storedToken) {
          setUser(restoredUser);
          setToken(storedToken);
          localStorage.setItem('user', JSON.stringify(restoredUser));
        }
      } catch {
        if (active && localStorage.getItem('authToken') === storedToken) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };
    const syncStorage = (event) => {
      if (event.key === 'authToken' || event.key === null) {
        setUser(null);
        setToken(null);
        setLoading(true);
        restore();
      }
    };
    window.addEventListener('auth-expired', clearSession);
    window.addEventListener('storage', syncStorage);
    restore();
    return () => {
      active = false;
      window.removeEventListener('auth-expired', clearSession);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event('auth-expired'));
    }, Math.min(Math.max(0, Date.parse(user.expiresAt) - Date.now()), 2147483647));
    return () => clearTimeout(timeout);
  }, [user]);

  const login = async (email, password) => {
    const request = ++operation.current;
    try {
      const { token: authToken, ...userData } = await authApi.login(email.trim(), password);
      if (!authToken || !validUser(userData)) throw new Error('Invalid login response');
      if (request !== operation.current) return { success: false, error: 'Login cancelled.' };
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      if (request === operation.current) {
        clearStoredSession();
        setToken(null);
        setUser(null);
      }
      return { success: false, error: error.response?.data?.message || 'Unable to sign in. Please try again.' };
    }
  };

  const logout = async () => {
    const previousToken = token;
    operation.current += 1;
    setToken(null);
    setUser(null);
    clearStoredSession();
    if (previousToken) {
      try {
        await authApi.logout(previousToken);
      } catch {
        return { success: false, error: 'Local session cleared; server logout could not be confirmed.' };
      }
    }
    return { success: true };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return Boolean(token && validUser(user));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return isAuthenticated() && user.role === role;
  };

  // Check if user is SuperAdmin
  const isSuperAdmin = () => {
    return hasRole('SuperAdmin');
  };

  // Check if user can manage content (SuperAdmin or ContentEditor)
  const canManageContent = () => {
    return hasRole('SuperAdmin') || hasRole('ContentEditor');
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isSuperAdmin,
    canManageContent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
