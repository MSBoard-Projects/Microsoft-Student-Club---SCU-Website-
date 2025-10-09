import React, { createContext, useState, useContext, useEffect } from 'react';
// import { authApi } from '../services/api'; // TEMPORARY: Commented out for testing

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    // TEMPORARY: Auto-login as SuperAdmin for testing
    const tempUser = {
      email: 'admin@msc-scu.com',
      role: 'SuperAdmin',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
    const tempToken = 'TEMPORARY_ADMIN_TOKEN_FOR_TESTING';
    
    setUser(tempUser);
    setToken(tempToken);
    localStorage.setItem('authToken', tempToken);
    localStorage.setItem('user', JSON.stringify(tempUser));
    
    setLoading(false);
  }, []);

  // Login function - TEMPORARY: Bypass actual API call
  const login = async (email, password) => {
    // TEMPORARY: Auto-approve any login attempt
    console.log('TEMPORARY MODE: Login bypassed, auto-approving as SuperAdmin');
    
    const userData = {
      email: 'admin@msc-scu.com',
      role: 'SuperAdmin',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    const authToken = 'TEMPORARY_ADMIN_TOKEN_FOR_TESTING';

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));

    return { success: true, user: userData };
  };

  // Logout function
  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (!token || !user) return false;

    // Check if token is expired
    const expiresAt = new Date(user.expiresAt);
    const now = new Date();

    if (now >= expiresAt) {
      // Token expired, logout user
      logout();
      return false;
    }

    return true;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
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
