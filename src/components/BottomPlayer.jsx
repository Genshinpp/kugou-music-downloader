// src/components/BottomPlayer.jsx
import React from 'react';

import { usePlayer } from '../contexts/PlayerContext';

const BottomPlayer = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    togglePlay,
    // pause,
    // play,
    seekTo,
    setVolume
    // nextSong,
    // prevSong
  } = usePlayer();

  // 计算进度百分比
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 格式化时间显示
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理进度条点击
  const handleProgressClick = (e) => {
    if (!currentSong || duration <= 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    seekTo(newTime);
  };

  // 处理音量滑块变化
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // 处理音量图标点击
  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(0.7);
    }
  };

  // 如果没有当前歌曲，则不显示播放器
  if (!currentSong) {
    return null;
  }

  return (
    <div className="bottom-player">
      {/* 进度条 */}
      <div className="player-progress-bar" onClick={handleProgressClick}>
        <div 
          className="progress-fill" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="player-container glass-effect">
        <div className="player-content">
          {/* 歌曲信息 */}
          <div className="song-info">
            <div className="song-cover">
              {currentSong.thumbnail ? (
                <img 
                  src={currentSong.thumbnail} 
                  alt={currentSong.title}
                  className="album-cover-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="album-cover-placeholder">
                🎵
              </div>
            </div>
            <div className="song-details">
              <div className="song-title" title={currentSong.title}>
                {currentSong.title || '未知歌曲'}
              </div>
              <div className="song-artist" title={currentSong.artist}>
                {currentSong.artist || '未知艺术家'}
              </div>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="player-controls">

            
            <button 
              className="control-btn play-btn glass-button"
              onClick={togglePlay}
              disabled={isLoading}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : isPlaying ? (
                <span className="play-icon play-pause-icon">⏸</span>
              ) : (
                <span className="play-icon play-pause-icon">▶</span>
              )}
            </button>

          </div>

          {/* 时间显示和音量控制 */}
          <div className="player-extras">
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
            
            <div className="volume-control">
              <button 
                className="volume-btn glass-button"
                onClick={toggleMute}
                title={volume > 0 ? '静音' : '取消静音'}
              >
                {volume > 0 ? '🔊' : '🔇'}
              </button>
              
              <div className="volume-slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="player-error">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPlayer;