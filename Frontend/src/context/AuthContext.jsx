import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dispatch_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('dispatch_token') || null;
  });

  const [loading, setLoading] = useState(false);

  const loginUser = async (email, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { user: userData, accesstoken } = response.data;

      setUser(userData);
      setToken(accesstoken);
      localStorage.setItem('dispatch_user', JSON.stringify(userData));
      if (accesstoken) {
        localStorage.setItem('dispatch_token', accesstoken);
      }
      return { success: true, message: response.data.message || 'Login successful' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', { name, email, password });
      const { user: userData, accesstoken } = response.data;

      setUser(userData);
      setToken(accesstoken);
      localStorage.setItem('dispatch_user', JSON.stringify(userData));
      if (accesstoken) {
        localStorage.setItem('dispatch_token', accesstoken);
      }
      return { success: true, message: response.data.message || 'Registration successful' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.warn('Logout endpoint error:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('dispatch_user');
      localStorage.removeItem('dispatch_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginUser,
        registerUser,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
