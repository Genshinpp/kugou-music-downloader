// src/components/AppLayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">加载中...</div>;
  }
  
  if (!isAuthenticated) {
    // 如果未认证，重定向到登录页面
    return <Navigate to="/login" replace />;
  }
  
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default AppLayout;