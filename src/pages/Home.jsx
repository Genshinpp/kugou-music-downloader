// src/pages/Home.jsx
import React, { useState, useRef } from 'react';
import { request, getSongUrl } from '../services/api';

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(new Audio());

  const searchSongs = async (page = 1) => {
    if (!keyword.trim()) {
      alert('请输入搜索关键词');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await request(`/search?type=song&keywords=${keyword}&page=${page}&pagesize=15`);
      setSongs(res.data.lists || []);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const playSong = async (song) => {
    try {
      const res = await getSongUrl(song.FileHash);
      const url = res.backupUrl[0];
      
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentSong(song);
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
              onKeyDown={e => e.key === 'Enter' && searchSongs()} 
              className="glass-input"
              disabled={isLoading}
            />
          </div>
          <button 
            onClick={searchSongs}
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
        <h2 className="section-title">🎶 搜索结果</h2>
        <div className="song-list">
          {songs.length > 0 ? (
            songs.map((song, index) => (
              <div key={`${song.FileHash}-${index}`} className="song-item glass-card">
                <div className="song-info">
                  <div className="song-title">{song.OriSongName}</div>
                  <div className="song-artist">🎤 {song.SingerName}</div>
                  <div className="song-album">💿 {song.AlbumName || '未知专辑'}</div>
                </div>
                <div className="song-actions">
                  <button 
                    className="action-button glass-button play-btn"
                    onClick={() => playSong(song)}
                  >
                    ▶️ 播放
                  </button>
                  <button 
                    className="action-button glass-button download-btn"
                    onClick={() => handleDownload(song)}
                  >
                    ⬇️ 下载
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results glass-card">
              <div className="empty-state">
                <span className="empty-icon">🎵</span>
                <p>{keyword ? '未找到相关歌曲' : '请输入关键词开始搜索'}</p>
                <small>支持搜索歌曲名、歌手名、专辑名</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 播放器 */}
      {currentSong && (
        <div className="audio-player glass-card">
          <div className="player-info">
            <div className="now-playing">
              <span className="playing-icon">♪</span>
              <div>
                <div className="song-name">{currentSong.OriSongName}</div>
                <div className="artist-name">{currentSong.SingerName}</div>
              </div>
            </div>
          </div>
          <div className="player-controls">
            <button 
              onClick={() => {
                isPlaying ? audioRef.current.pause() : audioRef.current.play();
                setIsPlaying(!isPlaying);
              }}
              className="control-button glass-button primary"
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;