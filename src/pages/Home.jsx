// src/pages/Home.jsx
import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Spin, Empty, message, Progress } from "antd";
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
import { useDownloadActions, useDownloadState } from "../contexts/DownloadContext";

// 单个歌曲项组件，使用memo优化
const SongItem = memo(({ song, albumImage, onPlay, onDownload, isLast, lastRef, downloadProgress }) => {
  const handlePlay = useCallback(() => {
    onPlay(song);
  }, [song, onPlay]);

  const handleDownload = useCallback((e) => {
    onDownload(song, e);
  }, [song, onDownload]);

  const progress = downloadProgress?.[song.FileHash];
  // 显示进度条：当有进度记录且进度 >= 0 时（包括0%）
  const isDownloading = progress !== undefined && progress !== null;
  
  // 格式化字节数为 MB
  const formatBytesToMB = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // 格式化剩余时间
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0 || !isFinite(seconds)) return '';
    
    if (seconds < 60) {
      return `${Math.ceil(seconds)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.ceil(seconds % 60);
      return `${minutes}分${secs}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分钟`;
    }
  };

  // 格式化下载速度
  const formatSpeed = (speed) => {
    if (!speed || speed <= 0) return '';
    if (speed < 1) {
      return `${(speed * 1024).toFixed(2)} KB/s`;
    }
    return `${speed.toFixed(2)} MB/s`;
  };

  return (
    <div
      className="song-item glass-card"
      ref={isLast ? lastRef : null}
    >
      {/* 专辑封面 */}
      <div className="song-cover">
        {albumImage ? (
          <img
            src={albumImage}
            alt={song.AlbumName || "专辑封面"}
            className="album-cover-img"
            loading="lazy"
            decoding="async"
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
        {/* 下载进度条 */}
        {isDownloading && progress && (
          <div className="download-progress-container" style={{ marginTop: '8px', width: '100%' }}>
            <Progress
              percent={progress.progress || 0}
              size="small"
              status={progress.progress === 100 ? "success" : "active"}
              showInfo={true}
              format={() => {
                if (progress.progress === 100) {
                  return `下载完成 ${formatBytesToMB(progress.total)}`;
                }
                if (progress.progress === 0) {
                  return "准备下载...";
                }
                // 显示已下载 MB / 总 MB
                const loadedMB = formatBytesToMB(progress.loaded);
                if (progress.total > 0) {
                  const totalMB = formatBytesToMB(progress.total);
                  return `${loadedMB} / ${totalMB}`;
                } else {
                  // 如果总大小未知，只显示已下载的 MB
                  return `已下载 ${loadedMB}`;
                }
              }}
              strokeColor={
                progress.progress === 100
                  ? '#87d068'
                  : {
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }
              }
            />
            {/* 下载速度和剩余时间信息 */}
            {progress.progress > 0 && progress.progress < 100 && (
              <div className="download-info">
                <span>
                  {progress.speed > 0 && (
                    <>速度: {formatSpeed(progress.speed)}</>
                  )}
                </span>
                <span>
                  {progress.timeRemaining > 0 && (
                    <>剩余: {formatTimeRemaining(progress.timeRemaining)}</>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="song-actions">
        <button
          className="action-button glass-button play-btn"
          onClick={handlePlay}
        >
          <PlayCircleOutlined />
          播放
        </button>
        <button
          className="action-button glass-button download-btn"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <LoadingOutlined />
              下载中
            </>
          ) : (
            <>
              <DownloadOutlined />
              下载
            </>
          )}
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：返回 true 表示 props 相同（不需要重新渲染），false 表示需要重新渲染
  const prevProgress = prevProps.downloadProgress?.[prevProps.song.FileHash];
  const nextProgress = nextProps.downloadProgress?.[nextProps.song.FileHash];
  
  // 如果进度发生变化，需要重新渲染
  if (prevProgress?.progress !== nextProgress?.progress) {
    return false; // 需要重新渲染
  }
  
  // 其他属性比较
  return (
    prevProps.song.FileHash === nextProps.song.FileHash &&
    prevProps.albumImage === nextProps.albumImage &&
    prevProps.onPlay === nextProps.onPlay &&
    prevProps.onDownload === nextProps.onDownload
  );
});

SongItem.displayName = 'SongItem';

// 独立的歌曲列表组件，使用memo优化渲染
const SongList = memo(({ songs, albumImages, onPlay, onDownload, lastRef, downloadProgress }) => {
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
        <SongItem
          key={`${song.FileHash}-${index}`}
          song={song}
          albumImage={albumImages[song.FileHash]}
          onPlay={onPlay}
          onDownload={onDownload}
          isLast={index === songs.length - 1}
          lastRef={lastRef}
          downloadProgress={downloadProgress}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只在关键属性变化时重新渲染
  return (
    prevProps.songs.length === nextProps.songs.length &&
    prevProps.songs.every((song, index) => 
      song.FileHash === nextProps.songs[index]?.FileHash
    ) &&
    Object.keys(prevProps.albumImages).length === Object.keys(nextProps.albumImages).length &&
    Object.keys(prevProps.albumImages).every(key => 
      prevProps.albumImages[key] === nextProps.albumImages[key]
    ) &&
    JSON.stringify(prevProps.downloadProgress) === JSON.stringify(nextProps.downloadProgress)
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
  const { downloadProgress } = useDownloadState();
  const { updateProgress, removeProgress } = useDownloadActions();

  // 批量获取专辑封面图片 - 优化：限制并发数和分批加载
  const fetchAlbumImagesBatch = async (songs) => {
    try {
      // 限制并发数，避免一次性加载太多图片导致卡顿
      const CONCURRENT_LIMIT = 5; // 每次最多5个并发请求
      const results = [];
      
      // 分批处理图片请求
      for (let i = 0; i < songs.length; i += CONCURRENT_LIMIT) {
        const batch = songs.slice(i, i + CONCURRENT_LIMIT);
        const batchPromises = batch.map(song => 
          getAlbumImages(song.FileHash, song.AlbumID || "")
            .then(res => ({ song, res }))
            .catch(error => ({ song, error }))
        );
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // 给浏览器一个喘息的机会，避免阻塞UI
        if (i + CONCURRENT_LIMIT < songs.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
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

  // 当搜索关键词改变时自动搜索 - 使用防抖优化
  useEffect(() => {
    if (!searchKeyword?.trim()) return;
    
    const timeoutId = setTimeout(() => {
      searchSongs(1);
    }, 300); // 300ms 防抖延迟
    
    return () => clearTimeout(timeoutId);
  }, [searchKeyword]); // 只依赖 searchKeyword，避免 searchSongs 变化导致重复执行

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
      playSong({
        ...song,
        title: song.OriSongName,
        artist: song.SingerName,
        album: song.AlbumName,
        url: url,
      });
    } catch (error) {
      console.error("播放失败:", error);
      message.error("播放失败，请稍后重试");
    }
  }, [playSong, songs]);

  const handleDownload = useCallback(async (song, event) => {
    const hash = song.FileHash;
    
    try {
      // 生成规范的文件名
      const filename = generateMusicFilename(song);

      // 创建进度回调函数
      const progressCallback = (progress, filename, loaded, total) => {
        updateProgress(hash, progress, filename, loaded, total);
      };

      // 使用axios下载，传入进度回调
      const result = await downloadSong(hash, filename, progressCallback);

      if (result.success) {
        console.log(`下载成功: ${result.filename}`);
        message.success(`下载成功: ${result.filename}`);
        
        // 延迟移除进度，让用户看到100%完成
        setTimeout(() => {
          removeProgress(hash);
        }, 1000);
      }
    } catch (error) {
      console.error("下载失败:", error);
      message.error(`下载失败: ${error.message}`);
      
      // 移除进度显示
      removeProgress(hash);
    }
  }, [updateProgress, removeProgress]);

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
              downloadProgress={downloadProgress}
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
