import React, { createContext, useContext, useEffect, useState } from 'react';
import userApi from '../services/userApi';
import { restoreAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await restoreAuthToken();

        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const res = await userApi.getCurrentUser();
        setCurrentUser(res.data);

      } catch (err) {
        console.log("Token restore failed", err);
        await clearAuthToken();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ ADD THIS
  const logout = async () => {
    await clearAuthToken();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loading,
        logout, // ✅ expose logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);