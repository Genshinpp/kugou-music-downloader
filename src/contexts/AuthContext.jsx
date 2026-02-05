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
    const token = getToken();
    const getUserDetail = async () => {
      // 获取用户详细信息
      try {
        const userInfo = await request(`/user/detail`);
        if (userInfo.error_code === 0 && userInfo.data) {
          setUser({
            ...token,
            profile: userInfo.data,
          });
        } else {
          // 如果获取详细信息失败，使用基本信息
          setUser(token);
        }
      } catch (error) {
        console.error("获取用户详情失败:", error);
        // 失败时仍然设置用户基本信息
        setUser(token);
      }
    };
    const checkAuth = async () => {
      try {
        request(`/login/token?token=${token?.token}&userid=${token?.userid}`)
          .then(() => {
            console.log("Token is valid");
            getUserDetail();
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
  }, []);

  const login = async (token) => {
    // 存储基本认证信息
    setToken(token);
  };

  const logout = () => {
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
