import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Compass, Library, Play, Pause, User, ShieldCheck, Sparkles, Volume2, VolumeX, Maximize2, X, Heart, Clock } from 'lucide-react';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('yt_favorites') || '[]');
    } catch {
      return [];
    }
  });
  const [currentVideo, setCurrentVideo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('yt_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [apiIndex, setApiIndex] = useState(0);
  const videoRef = useRef(null);

  const apiBase = PIPED_INSTANCES[apiIndex];

  useEffect(() => {
    fetchTrending();
  }, [apiIndex]);

  useEffect(() => {
    localStorage.setItem('yt_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/trending?region=RU`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch {
      if (apiIndex < PIPED_INSTANCES.length - 1) {
        setApiIndex(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(searchQuery)}&filter=videos`);
      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playVideo = async (video) => {
    setCurrentVideo(video);
    setIsExpanded(true);
    setIsPlaying(true);
    setStreamUrl(null);
    const videoId = video.url?.split('v=')[1] || video.url?.replace('/watch?v=', '');
    if (!videoId) return;

    try {
      const res = await fetch(`${apiBase}/streams/${videoId}`);
      const data = await res.json();
      const streams = data.videoStreams || [];
      const bestMuxed = streams.find(s => !s.videoOnly && s.format === 'MPEG_4') || streams.find(s => !s.videoOnly) || streams[0];
      if (bestMuxed?.url) {
        setStreamUrl(bestMuxed.url);
      }
    } catch (err) {
      console.error('Stream load error:', err);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleFavorite = (video, e) => {
    e?.stopPropagation();
    const exists = favorites.some(f => f.url === video.url);
    if (exists) {
      setFavorites(favorites.filter(f => f.url !== video.url));
    } else {
      setFavorites([video, ...favorites]);
    }
  };

  const handleGoogleAuth = () => {
    if (user) {
      setUser(null);
      localStorage.removeItem('yt_user');
    } else {
      const mockUser = {
        name: 'Google Account',
        email: 'user@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
      };
      setUser(mockUser);
      localStorage.setItem('yt_user', JSON.stringify(mockUser));
    }
  };

  const displayedVideos = activeTab === 'library' ? favorites : videos;

  return (
    <div className="bg-[#0f0f10] text-white min-h-screen pb-32 font-sans select-none pt-safe">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f10]/85 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white via-gray-200 to-purple-400 bg-clip-text text-transparent">
            YT Custom
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="flex items-center text-[11px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> AdBlock
          </span>
          <button
            onClick={handleGoogleAuth}
            className="flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
          >
            {user ? (
              <>
                <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                <span className="max-w-[80px] truncate">{user.name}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                <span>Google</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Search */}
      {activeTab !== 'library' && (
        <div className="px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Поиск видео и музыки без рекламы..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e1f22] text-white placeholder-gray-500 text-sm rounded-2xl px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/5 transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          </form>
        </div>
      )}

      {/* Content */}
      <main className="px-4 space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {activeTab === 'library' ? 'Избранное и Плейлисты' : 'Рекомендации'}
          </h2>
          {loading && <span className="text-xs text-purple-400 animate-pulse">Загрузка...</span>}
        </div>

        {displayedVideos.length === 0 && !loading ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            {activeTab === 'library' ? 'Список избранного пуст' : 'Ничего не найдено'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {displayedVideos.map((video, idx) => {
              const isFav = favorites.some(f => f.url === video.url);
              return (
                <div
                  key={idx}
                  onClick={() => playVideo(video)}
                  className="bg-[#18191c] rounded-2xl p-3 hover:bg-[#202125] active:scale-[0.99] transition cursor-pointer group border border-white/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-2.5 bg-gray-800">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      {video.duration > 0 && (
                        <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-sm text-[11px] px-2 py-0.5 rounded-md text-gray-200">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      )}
                      <button
                        onClick={(e) => toggleFavorite(video, e)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-purple-500 text-purple-500' : 'text-white'}`} />
                      </button>
                    </div>
                    <h3 className="text-sm font-medium text-gray-100 line-clamp-2 leading-snug">{video.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 truncate">{video.uploaderName}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fullscreen / Mini Player */}
      {currentVideo && (
        <div
          className={`fixed z-50 transition-all duration-300 bg-[#16171a] border border-white/10 shadow-2xl ${
            isExpanded
              ? 'inset-0 flex flex-col justify-between p-4 pt-12 pb-8'
              : 'bottom-16 left-3 right-3 rounded-2xl p-2.5 flex items-center justify-between'
          }`}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="p-2 rounded-full bg-white/10 text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-xs font-medium text-purple-400">Плеер без рекламы</span>
                <button
                  onClick={(e) => toggleFavorite(currentVideo, e)}
                  className="p-2 rounded-full bg-white/10"
                >
                  <Heart className={`w-5 h-5 ${favorites.some(f => f.url === currentVideo.url) ? 'fill-purple-500 text-purple-500' : 'text-white'}`} />
                </button>
              </div>

              <div className="my-auto space-y-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl border border-white/10">
                  {streamUrl ? (
                    <video
                      ref={videoRef}
                      src={streamUrl}
                      poster={currentVideo.thumbnail}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                      <img src={currentVideo.thumbnail} className="w-full h-full object-cover opacity-40 absolute" alt="" />
                      <span className="relative z-10 text-xs bg-black/70 px-3 py-1.5 rounded-full">Получение прямого потока...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white leading-snug">{currentVideo.title}</h2>
                  <p className="text-xs text-gray-400">{currentVideo.uploaderName}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/40"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3 truncate">
                <img src={currentVideo.thumbnail} className="w-11 h-11 rounded-xl object-cover shrink-0" alt="" />
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-white truncate">{currentVideo.title}</h4>
                  <p className="text-[10px] text-purple-400 truncate">Нажмите, чтобы развернуть</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f10]/95 backdrop-blur-xl border-t border-white/5 py-2.5 px-8 flex justify-between items-center z-40 text-gray-400">
        <button
          onClick={() => { setActiveTab('home'); fetchTrending(); }}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-purple-400' : ''}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Главная</span>
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'explore' ? 'text-purple-400' : ''}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Обзор</span>
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'library' ? 'text-purple-400' : ''}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-medium">Избранное</span>
        </button>
      </nav>
    </div>
  );
}
