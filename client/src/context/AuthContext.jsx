import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated user session on initial app render
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const res = await authService.getMe();
        if (res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        // Not authenticated or token expired - silent reset
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Register action
  const register = async (name, email, password) => {
    try {
      setError(null);
      const res = await authService.register({ name, email, password });
      setUser(res.user);
      setIsAuthenticated(true);
      return res;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await authService.login({ email, password });
      setUser(res.user);
      setIsAuthenticated(true);
      return res;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout request warning:', err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Profile update action
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const res = await authService.updateProfile(profileData);
      setUser(res.user);
      return res;
    } catch (err) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };

  // Change password action
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const res = await authService.changePassword({ currentPassword, newPassword });
      if (res.user) {
        setUser(res.user);
      }
      return res;
    } catch (err) {
      setError(err.message || 'Password change failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
