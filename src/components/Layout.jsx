// src/components/Layout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">
          <Link to="/">🎵 音乐下载器</Link>
        </div>
        <nav className="nav">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            首页
          </Link>
          {user && (
            <>
              <span className="user-info">
                欢迎, {user.nickname || user.username || '用户'}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                退出登录
              </button>
            </>
          )}
        </nav>
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <p>© 2026 音乐下载器 - 享受高品质音乐</p>
      </footer>
    </div>
  );
};

export default Layout;