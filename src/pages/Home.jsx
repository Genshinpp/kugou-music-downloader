// src/pages/Home.jsx
import React, { useState, useRef } from 'react';
import { request, getSongUrl } from '../services/api';

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  const searchSongs = async (page = 1) => {
    try {
      const res = await request(`/search?type=song&keywords=${keyword}&page=${page}&pagesize=15`);
      setSongs(res.data.lists || []);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请稍后重试');
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
      <div className="search-section">
        <div className="search-box">
          <input 
            placeholder="输入歌曲名..." 
            value={keyword} 
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchSongs()} 
          />
          <button onClick={() => searchSongs()}>搜索</button>
        </div>
      </div>

      <div className="songs-section">
        <h2>搜索结果</h2>
        <div className="song-list">
          {songs.length > 0 ? (
            songs.map(song => (
              <div key={song.FileHash} className="song-item">
                <div className="song-info">
                  <div className="song-title">{song.OriSongName}</div>
                  <div className="song-artist">{song.SingerName}</div>
                </div>
                <div className="song-actions">
                  <button 
                    className="play-btn"
                    onClick={() => playSong(song)}
                  >
                    ▶️ 播放
                  </button>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(song)}
                  >
                    ⬇️ 下载
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              {keyword ? '未找到相关歌曲' : '请输入关键词搜索歌曲'}
            </div>
          )}
        </div>
      </div>

      {currentSong && (
        <div className="audio-player">
          <div className="player-info">
            <span>正在播放: {currentSong.OriSongName} - {currentSong.SingerName}</span>
          </div>
          <div className="player-controls">
            <button 
              onClick={() => {
                isPlaying ? audioRef.current.pause() : audioRef.current.play();
                setIsPlaying(!isPlaying);
              }}
              className="control-btn"
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