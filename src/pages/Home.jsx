// src/pages/Home.jsx
import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin, Empty, message    } from "antd";
import {
  PlayCircleOutlined,
  DownloadOutlined,
  UserOutlined,
  DatabaseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  request,
  getSongUrl,
  getAlbumImages,
  downloadSong,
} from "../services/api";
import { generateMusicFilename } from "../utils/filename";
import { usePlayerActions } from "../contexts/PlayerContext";
import { useSearch } from "../contexts/SearchContext";

// 独立的歌曲列表组件，使用memo优化渲染
const SongList = memo(({ songs, albumImages, onPlay, onDownload, lastRef }) => {
  console.log("SongList 渲染了"); // 调试用，优化后应该很少打印
  
  if (songs.length === 0) {
    return (
      <div className="no-results glass-card">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="未找到相关歌曲"
        >
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.9rem",
            }}
          >
            支持搜索歌曲名、歌手名、专辑名
          </p>
        </Empty>
      </div>
    );
  }

  return (
    <div className="song-list">
      {songs.map((song, index) => (
        <div
          key={`${song.FileHash}-${index}`}
          className="song-item glass-card"
          ref={index === songs.length - 1 ? lastRef : null}
        >
          {/* 专辑封面 */}
          <div className="song-cover">
            {albumImages[song.FileHash] ? (
              <img
                src={albumImages[song.FileHash]}
                alt={song.AlbumName || "专辑封面"}
                className="album-cover-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div className="album-cover-placeholder">🎵</div>
          </div>

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
                <DatabaseOutlined /> {song.AlbumName || "未知专辑"}
              </span>
            </div>
          </div>
          <div className="song-actions">
            <button
              className="action-button glass-button play-btn"
              onClick={() => onPlay(song)}
            >
              <PlayCircleOutlined />
              播放
            </button>
            <button
              className="action-button glass-button download-btn"
              onClick={() => onDownload(song)}
            >
              <DownloadOutlined />
              下载
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(15);
  const [hasMore, setHasMore] = useState(true);
  const [albumImages, setAlbumImages] = useState({}); // 存储专辑封面图片URL
  const observerRef = useRef();

  const { playSong } = usePlayerActions();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchKeyword, finishSearch } = useSearch();

  // 批量获取专辑封面图片
  const fetchAlbumImagesBatch = async (songs) => {
    try {
      // 收集所有请求
      const imagePromises = songs.map(song => 
        getAlbumImages(song.FileHash, song.AlbumID || "")
          .then(res => ({ song, res }))
          .catch(error => ({ song, error }))
      );
      
      // 并行执行所有请求
      const results = await Promise.all(imagePromises);
      
      // 处理结果并批量更新状态
      const newImages = {};
      
      results.forEach(({ song, res, error }) => {
        if (error) {
          console.error(`获取歌曲 ${song.OriSongName} 封面失败:`, error);
          return;
        }
        
        if (res?.data && res.data.length > 0) {
          let imageUrl = "";
          
          // 优先检查 album 数组中的 sizable_cover
          if (res.data[0].album && res.data[0].album.length > 0) {
            const album = res.data[0].album[0];
            imageUrl = album.sizable_cover || "";
            if (imageUrl) {
              imageUrl = imageUrl.replace("{size}", "200");
            }
          }
          
          // 如果 album 中没有找到，检查 author 中的图片
          if (!imageUrl && res.data[0].author && res.data[0].author.length > 0) {
            const author = res.data[0].author[0];
            
            if (author.imgs && author.imgs["3"] && author.imgs["3"].length > 0) {
              imageUrl = author.imgs["3"][0]?.sizable_portrait || "";
              if (imageUrl) {
                imageUrl = imageUrl.replace("{size}", "200");
              }
            } else if (author.imgs && author.imgs["4"] && author.imgs["4"].length > 0) {
              imageUrl = author.imgs["4"][0]?.sizable_portrait || "";
              if (imageUrl) {
                imageUrl = imageUrl.replace("{size}", "200");
              }
            } else if (author.sizable_avatar) {
              imageUrl = author.sizable_avatar.replace("{size}", "200");
            }
          }
          
          if (imageUrl) {
            newImages[song.FileHash] = imageUrl;
          }
        }
      });
      
      // 一次性更新所有图片状态
      setAlbumImages(prev => ({ ...prev, ...newImages }));
      
    } catch (error) {
      console.error("批量获取专辑图片失败:", error);
    }
  };

  const searchSongs = useCallback(
    async (page = 1) => {
      // 如果没有关键词且不是分页操作，提示用户输入
      if (!searchKeyword?.trim() && page === 1) {
        // 不再弹出alert，让用户自己输入
        return;
      }

      // 如果没有关键词但有分页操作，使用之前的关键词
      const keyword = searchKeyword?.trim() || "";

      if (!keyword) {
        return;
      }

      try {
        setIsLoading(true);
        const res = await request(
          `/search?type=song&keywords=${keyword}&page=${page}&pagesize=${pageSize}`
        );
        const data = res.data;
        if (page === 1) {
          setSongs(data.lists || []);
          // 批量获取新搜索结果的专辑封面
          fetchAlbumImagesBatch(data.lists || []);
        } else {
          const newSongs = data.lists || [];
          setSongs((prevSongs) => [...prevSongs, ...newSongs]);
          // 批量获取新增歌曲的专辑封面
          fetchAlbumImagesBatch(newSongs);
        }
        setTotal(data.total || 0);
        setCurrentPage(page);
        setHasMore(page * pageSize < (data.total || 0));

        // 更新URL参数
        if (page === 1) {
          const searchParams = new URLSearchParams(location.search);
          searchParams.set("q", keyword);
          navigate(`/?${searchParams.toString()}`, { replace: true });
        }
      } catch (error) {
        console.error("搜索失败:", error);
        message.error("搜索失败，请稍后重试");
      } finally {
        setIsLoading(false);
        setIsLazyLoading(false);
        finishSearch(); // 完成搜索后关闭加载状态
      }
    },
    [searchKeyword, pageSize, location.search, navigate, finishSearch]
  );

  // 页面加载时检查URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get("q");
    if (query) {
      searchSongs(1);
    }
  }, [location.search, searchSongs]);

  // 当搜索关键词改变时自动搜索
  useEffect(() => {
    searchSongs(1);
  }, [searchSongs]); // 移除 searchSongs 依赖，避免函数变化导致重复执行

  const loadMoreSongs = useCallback(() => {
    if (!hasMore || isLoading || isLazyLoading) return;
    setIsLazyLoading(true);
    searchSongs(currentPage + 1);
  }, [hasMore, isLoading, isLazyLoading, searchSongs, currentPage]);

  const lastSongElementRef = useCallback(
    (node) => {
      if (isLoading || isLazyLoading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreSongs();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLazyLoading, hasMore, loadMoreSongs]
  );

  const handlePlaySong = useCallback(async (song) => {
    try {
      const res = await getSongUrl(song.FileHash);
      const url = res.backupUrl[0];

      // 使用新的播放器上下文
      playSong(
        {
          ...song,
          title: song.OriSongName,
          artist: song.SingerName,
          album: song.AlbumName,
          url: url,
        },
        songs,
        songs.findIndex((s) => s.FileHash === song.FileHash)
      );
    } catch (error) {
      console.error("播放失败:", error);
      message.error("播放失败，请稍后重试");
    }
  }, [playSong, songs]);

  const handleDownload = useCallback(async (song) => {
    try {
      // 显示下载中提示
      const downloadBtn = event.target.closest(".action-button");
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '<span class="spinner"></span> 下载中...';
      downloadBtn.disabled = true;

      // 生成规范的文件名
      const filename = generateMusicFilename(song);

      // 使用axios下载
      const result = await downloadSong(song.FileHash, filename);

      if (result.success) {
        console.log(`下载成功: ${result.filename}`);
      }

      // 恢复按钮状态
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    } catch (error) {
      console.error("下载失败:", error);
      message.error(`下载失败: ${error.message}`);

      // 恢复按钮状态
      const downloadBtn = event.target.closest(".action-button");
      if (downloadBtn) {
        const originalText = downloadBtn.innerHTML.replace(
          '<span class="spinner"></span> 下载中...',
          "📥 下载"
        );
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
      }
    }
  }, [downloadSong]);

  return (
    <div className="home-container">
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
            <SongList 
              songs={songs}
              albumImages={albumImages}
              onPlay={handlePlaySong}
              onDownload={handleDownload}
              lastRef={lastSongElementRef}
            />
          </Spin>

          {/* 懒加载指示器 */}
          {isLazyLoading && (
            <div className="lazy-loading-indicator">
              <LoadingOutlined style={{ fontSize: 24, color: "#1890ff" }} />
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
