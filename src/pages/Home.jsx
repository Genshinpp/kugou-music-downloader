// src/pages/Home.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Spin, Empty } from 'antd';
import { SearchOutlined, PlayCircleOutlined, DownloadOutlined, UserOutlined, DatabaseOutlined, LoadingOutlined } from '@ant-design/icons';
import { request, getSongUrl } from '../services/api';
import { usePlayer } from '../contexts/PlayerContext';

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();
  
  const { playSong } = usePlayer();

  const searchSongs = useCallback(async (page = 1) => {
    // 如果没有关键词且不是分页操作，提示用户输入
    if (!keyword.trim() && page === 1) {
      alert('请输入搜索关键词');
      return;
    }
    
    // 如果没有关键词但有分页操作，使用之前的关键词
    const searchKeyword = keyword.trim() || (songs.length > 0 ? keyword : '');
    
    if (!searchKeyword) {
      alert('请输入搜索关键词');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await request(`/search?type=song&keywords=${searchKeyword}&page=${page}&pagesize=${pageSize}`);
      const data = res.data;
      if (page === 1) {
        setSongs(data.lists || []);
      } else {
        setSongs(prevSongs => [...prevSongs, ...(data.lists || [])]);
      }
      setTotal(data.total || 0);
      setCurrentPage(page);
      setHasMore((page * pageSize) < (data.total || 0));
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请稍后重试');
    } finally {
      setIsLoading(false);
      setIsLazyLoading(false);
    }
  }, [keyword, songs.length, pageSize]);

  const loadMoreSongs = useCallback(() => {
    if (!hasMore || isLoading || isLazyLoading) return;
    setIsLazyLoading(true);
    searchSongs(currentPage + 1);
  }, [hasMore, isLoading, isLazyLoading, currentPage, searchSongs]);

  const lastSongElementRef = useCallback(node => {
    if (isLoading || isLazyLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreSongs();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [isLoading, isLazyLoading, hasMore, loadMoreSongs]);

  const handlePlaySong = async (song) => {
    try {
      const res = await getSongUrl(song.FileHash);
      const url = res.backupUrl[0];
      
      // 使用新的播放器上下文
      playSong({
        ...song,
        title: song.OriSongName,
        artist: song.SingerName,
        album: song.AlbumName,
        url: url
      }, songs, songs.findIndex(s => s.FileHash === song.FileHash));
    } catch (error) {
      console.error('播放失败:', error);
      alert('播放失败，请稍后重试');
    }
  };

  const handleDownload = (song) => {
    getSongUrl(song.FileHash).then(res => {
      const link = document.createElement('a');
      link.href = res.backupUrl[0];
      link.download = `${song.FileName}.${res.extName}`;
      link.click();
    }).catch(error => {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    });
  };

  return (
    <div className="home-container">
      {/* 搜索区域 */}
      <div className="search-section glass-card">
        <h2 className="section-title">🎵 音乐搜索</h2>
        <div className="search-box">
          <div className="input-wrapper">
            <span className="input-icon">🔍</span>
            <input 
              placeholder="输入歌曲名、歌手或专辑..." 
              value={keyword} 
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchSongs(1)} 
              className="glass-input"
              disabled={isLoading}
            />
          </div>
          <button 
            onClick={() => searchSongs(1)}
            disabled={isLoading}
            className="search-button glass-button primary"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                搜索中...
              </>
            ) : '搜索音乐'}
          </button>
        </div>
      </div>

      {/* 结果区域 */}
      <div className="results-section">
        <div className="results-header">
          <h2 className="section-title">🎶 搜索结果</h2>
          {total > 0 && (
            <div className="results-info">
              <span>共找到 {total} 首歌曲</span>
              <span>共 {currentPage} 页</span>
            </div>
          )}
        </div>
        
        <div className="song-list-container">
          <Spin spinning={isLoading} size="large" tip="搜索中...">
            <div className="song-list">
              {songs.length > 0 ? (
                songs.map((song, index) => (
                  <div 
                    key={`${song.FileHash}-${index}`} 
                    className="song-item glass-card"
                    ref={index === songs.length - 1 ? lastSongElementRef : null}
                  >
                    <div className="song-info">
                      <div className="song-title">
                        <PlayCircleOutlined className="title-icon" />
                        {song.OriSongName}
                      </div>
                      <div className="song-meta">
                        <span className="song-artist">
                          <UserOutlined /> {song.SingerName}
                        </span>
                        <span className="song-album">
                          <DatabaseOutlined /> {song.AlbumName || '未知专辑'}
                        </span>
                      </div>
                    </div>
                    <div className="song-actions">
                      <button 
                        className="action-button glass-button play-btn"
                        onClick={() => handlePlaySong(song)}
                      >
                        <PlayCircleOutlined />
                        播放
                      </button>
                      <button 
                        className="action-button glass-button download-btn"
                        onClick={() => handleDownload(song)}
                      >
                        <DownloadOutlined />
                        下载
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results glass-card">
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={keyword ? '未找到相关歌曲' : '请输入关键词开始搜索'}
                  >
                    <p style={{color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem'}}>支持搜索歌曲名、歌手名、专辑名</p>
                  </Empty>
                </div>
              )}
            </div>
          </Spin>
          
          {/* 懒加载指示器 */}
          {isLazyLoading && (
            <div className="lazy-loading-indicator">
              <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <span>加载更多歌曲...</span>
            </div>
          )}
          
          {/* 没有更多数据提示 */}
          {!hasMore && songs.length > 0 && (
            <div className="no-more-data">
              <span>没有更多歌曲了</span>
            </div>
          )}
        </div>
        

      </div>


    </div>
  );
};

export default Home;