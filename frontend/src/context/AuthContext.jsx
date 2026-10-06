import { createContext, useContext, useState } from 'react';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
} from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);

    try {
      const data = await loginUser(email, password);

      setAccessToken(data.accessToken);
      setUser(data.user);

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await logoutUser();
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    const newAccessToken = await refreshAccessToken();

    setAccessToken(newAccessToken);

    return newAccessToken;
  };

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}