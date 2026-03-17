import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('bahari_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bahari_token');
    if (token) {
      authAPI
        .getMe()
        .then((res) => {
          setUser(res.data.data);
          connectSocket();
        })
        .catch(() => {
          localStorage.removeItem('bahari_token');
          localStorage.removeItem('bahari_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('bahari_token', token);
    localStorage.setItem('bahari_user', JSON.stringify(userData));
    setUser(userData);
    connectSocket();
  };

  const logout = () => {
    localStorage.removeItem('bahari_token');
    localStorage.removeItem('bahari_user');
    setUser(null);
    disconnectSocket();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
