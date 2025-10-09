import React, { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      // Call login API
      const response = await authApi.login(email, password);

      // Extract token and user data from response
      const { token: authToken, email: userEmail, role, expiresAt } = response;

      // Create user object
      const userData = {
        email: userEmail,
        role,
        expiresAt,
      };

      // Store in state
      setToken(authToken);
      setUser(userData);

      // Persist in localStorage
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      
      return { success: false, error: errorMessage };
    }
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
