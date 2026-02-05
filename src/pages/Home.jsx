// src/pages/Home.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { usePlayer } from "../contexts/PlayerContext";
import { useSearch } from "../contexts/SearchContext";

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

  const { playSong } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchKeyword, finishSearch } = useSearch();

  // 获取专辑封面图片
  const fetchAlbumImage = async (song) => {
    try {
      const res = await getAlbumImages(song.FileHash, song.AlbumID || "");
      console.log("专辑图片API响应:", res);

      if (res.data && res.data.length > 0) {
        // 根据实际返回格式解析专辑封面
        let imageUrl = "";

        // 优先检查 album 数组中的 sizable_cover
        if (res.data[0].album && res.data[0].album.length > 0) {
          const album = res.data[0].album[0];
          console.log("找到专辑信息:", album);
          imageUrl = album.sizable_cover || "";
          // 替换 {size} 为实际尺寸
          if (imageUrl) {
            imageUrl = imageUrl.replace("{size}", "200");
            console.log("使用专辑封面:", imageUrl);
          }
        }

        // 如果 album 中没有找到，检查 author 中的图片
        if (!imageUrl && res.data[0].author && res.data[0].author.length > 0) {
          const author = res.data[0].author[0];
          console.log("使用歌手信息:", author);

          // 优先使用 imgs['3'] 中的图片
          if (author.imgs && author.imgs["3"] && author.imgs["3"].length > 0) {
            imageUrl = author.imgs["3"][0]?.sizable_portrait || "";
            if (imageUrl) {
              imageUrl = imageUrl.replace("{size}", "200");
              console.log("使用歌手图片[3]:", imageUrl);
            }
          }
          // 其次使用 imgs['4'] 中的图片
          else if (
            author.imgs &&
            author.imgs["4"] &&
            author.imgs["4"].length > 0
          ) {
            imageUrl = author.imgs["4"][0]?.sizable_portrait || "";
            if (imageUrl) {
              imageUrl = imageUrl.replace("{size}", "200");
              console.log("使用歌手图片[4]:", imageUrl);
            }
          }
          // 最后使用 avatar
          else if (author.sizable_avatar) {
            imageUrl = author.sizable_avatar.replace("{size}", "200");
            console.log("使用歌手头像:", imageUrl);
          }
        }

        if (imageUrl) {
          console.log(`为歌曲 ${song.OriSongName} 设置封面:`, imageUrl);
          setAlbumImages((prev) => ({
            ...prev,
            [song.FileHash]: imageUrl,
          }));
        } else {
          console.log("未找到有效的封面图片");
        }
      } else {
        console.log("API返回空数据");
      }
    } catch (error) {
      console.error("获取专辑图片失败:", error);
      // 即使获取失败也不影响主流程
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
          // 为新搜索结果获取专辑封面
          (data.lists || []).forEach((song) => {
            fetchAlbumImage(song);
          });
        } else {
          const newSongs = data.lists || [];
          setSongs((prevSongs) => [...prevSongs, ...newSongs]);
          // 为新增的歌曲获取专辑封面
          newSongs.forEach((song) => {
            fetchAlbumImage(song);
          });
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

  const handlePlaySong = async (song) => {
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
  };

  const handleDownload = async (song) => {
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
  };

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
            <div className="song-list">
              {songs.length > 0 ? (
                songs.map((song, index) => (
                  <div
                    key={`${song.FileHash}-${index}`}
                    className="song-item glass-card"
                    ref={index === songs.length - 1 ? lastSongElementRef : null}
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
                    description={
                      searchKeyword ? "未找到相关歌曲" : "请输入关键词开始搜索"
                    }
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
              )}
            </div>
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
