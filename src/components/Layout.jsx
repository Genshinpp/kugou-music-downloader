// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { SearchOutlined } from '@ant-design/icons';
import BottomPlayer from './BottomPlayer';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isSearching, handleSearch: contextHandleSearch } = useSearch();
  const [localKeyword, setLocalKeyword] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (localKeyword.trim()) {
      contextHandleSearch(localKeyword.trim());
    }
  };

  return (
    <div className="app-layout">
      {/* 背景效果 */}
      <div className="app-background">
        <div className="gradient-overlay"></div>
        <div className="floating-elements">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`floating-element app-element-${i + 1}`}></div>
          ))}
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="app-container glass-effect">
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <Link to="/">🎵 音乐下载器</Link>
            </div>
            {location.pathname === '/' && (
              <form onSubmit={handleSearch} className="header-search-form">
                <div className="search-wrapper">
                  <span className="search-icon">
                    <SearchOutlined />
                  </span>
                  <input
                    type="text"
                    placeholder="搜索歌曲、歌手、专辑..."
                    value={localKeyword}
                    onChange={(e) => setLocalKeyword(e.target.value)}
                    className="header-search-input glass-input"
                    disabled={isSearching}
                  />
                  <button 
                    type="submit" 
                    className="header-search-button glass-button primary"
                    disabled={isSearching}
                  >
                    {isSearching ? '搜索中...' : '搜索'}
                  </button>
                </div>
              </form>
            )}
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
                <div className="user-profile">
                  <div className="user-avatar">
                    <img 
                      src={user.profile?.avatarUrl || user.profile?.pic || '/default-avatar.png'} 
                      alt="用户头像" 
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <span className="user-nickname">
                    {user.profile?.nickname || user.profile?.k_nickname || user.account?.userName || '用户'}
                  </span>
                </div>
                <button onClick={handleLogout} className="logout-btn glass-button">
                  退出登录
                </button>
              </>
            )}
          </nav>
        </header>
        
        <main className="app-main">
          {children}
        </main>
        
        <footer className="app-footer">
          <p>© 2026 音乐下载器 - 享受高品质音乐体验</p>
        </footer>
      </div>
      
      {/* 底部播放器 */}
      <BottomPlayer />
    </div>
  );
};

export default Layout;