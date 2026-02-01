// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { request } from "../services/api";
import { getToken, removeToken, setToken } from "../utils/token";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查本地存储中的用户信息并验证 token
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      try {
        request(`/login/token?token=${token?.token}&userid=${token?.userid}`)
          .then(() => {
            console.log("Token is valid");
            setUser("username");
          })
          .catch(() => {
            console.log("Token is invalid");
            setUser(null);
          });
      } catch (error) {
        console.error("Failed to parse auth data:", error);
        localStorage.removeItem("auth");
      }
      setLoading(false);
    };

    checkAuth();
  });

  const login = (token) => {
    setUser('username');
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    removeToken();
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
