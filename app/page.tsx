'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { songs } from '@/data/songs';
import { Song, getDifficultyForVersion } from '@/lib/types';
import Fuse from 'fuse.js';
import Navbar from './components/Navbar';
import FilterBar, { FilterState, INITIAL_FILTERS } from './components/FilterBar';
import { Music2, LayoutGrid, List } from 'lucide-react';
import SongCard from './components/SongCard';

// Lazy loading config
const INITIAL_ITEM_COUNT = 24; // Initial number of items to show
const BATCH_SIZE = 16; // Number of items to load per batch

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  // 移动端检测并设置默认视图模式
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

  // Lazy loading state (shared between card and list mode)
  const [visibleItemCount, setVisibleItemCount] = useState(INITIAL_ITEM_COUNT);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // 移动端检测：如果是移动端则默认使用列表模式
  useEffect(() => {
    const checkMobile = () => {
      // 屏幕宽度小于 768px 认为是移动端
      if (window.innerWidth < 768) {
        setViewMode('list');
      } else {
        setViewMode('card');
      }
    };

    // 初始检测
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Filter songs based on selected navbar version
  // Also prepare version-specific difficulties
  const versionFilteredSongs = useMemo(() => {
    let filtered = songs;
    if (selectedVersion !== 'all') {
      filtered = songs.filter((song) => song.versionHistory?.includes(selectedVersion));
    }

    // For each song, calculate the difficulty to display for the selected version
    return filtered.map(song => {
      const versionDifficulties = getDifficultyForVersion(song, selectedVersion);
      return {
        ...song,
        // Override difficulties with version-specific ones if available
        displayDifficulties: versionDifficulties || song.difficulties,
      };
    });
  }, [selectedVersion]);

  // Reset visible card count when filters or version changes
  useEffect(() => {
    setVisibleItemCount(INITIAL_ITEM_COUNT);
  }, [filters, selectedVersion]);

  // Setup Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(versionFilteredSongs, {
      keys: ['title', 'artist'],
      threshold: 0.3,
    });
  }, [versionFilteredSongs]);

  // Apply all filters
  const filteredSongs = useMemo(() => {
    let result = versionFilteredSongs;

    // Text search
    if (filters.search.trim()) {
      result = fuse.search(filters.search).map((item) => item.item);
    }

    // Artist search
    if (filters.artist.trim()) {
      result = result.filter((song) =>
        song.artist.toLowerCase().includes(filters.artist.toLowerCase())
      );
    }

    // Genre filter
    if (filters.genre !== '全部') {
      if (filters.genre === '未分类') {
        // 筛选没有 genre 的歌曲
        result = result.filter((song) => !song.genre);
      } else {
        result = result.filter((song) => song.genre === filters.genre);
      }
    }

    // firstAppearance filter
    if (filters.firstAppearance !== '全部') {
      result = result.filter((song) => song.firstAppearance === filters.firstAppearance);
    }

    // Difficulty type and level filters (use displayDifficulties)
    // 默认等级范围是 1-10.9，如果不是默认值则应用过滤
    const isDefaultLevelRange = (filters.minLevel ?? 1) === 1 && (filters.maxLevel ?? 10.9) === 10.9;

    if (filters.difficulty !== 'all') {
      const diffKey = filters.difficulty;
      result = result.filter((song) => {
        const level = song.displayDifficulties[diffKey].level;
        const minLevel = filters.minLevel ?? 1;
        const maxLevel = filters.maxLevel ?? 10.9;
        if (level < minLevel) return false;
        if (level > maxLevel) return false;
        return true;
      });
    } else if (!isDefaultLevelRange) {
      // If no specific difficulty selected, check extreme by default
      result = result.filter((song) => {
        const level = song.displayDifficulties.extreme.level;
        const minLevel = filters.minLevel ?? 1;
        const maxLevel = filters.maxLevel ?? 10.9;
        if (level < minLevel) return false;
        if (level > maxLevel) return false;
        return true;
      });
    }

    // Notes range filter (use displayDifficulties)
    if (filters.minNotes || filters.maxNotes) {
      result = result.filter((song) => {
        const notes = song.displayDifficulties.extreme.notes;
        if (filters.minNotes && notes < filters.minNotes) return false;
        if (filters.maxNotes && notes > filters.maxNotes) return false;
        return true;
      });
    }

    // BPM range filter
    if (filters.minBpm || filters.maxBpm) {
      result = result.filter((song) => {
        if (filters.minBpm && song.bpm < filters.minBpm) return false;
        if (filters.maxBpm && song.bpm > filters.maxBpm) return false;
        return true;
      });
    }

    // 谱面标记过滤器
    if (filters.chartPattern !== 'all') {
      result = result.filter((song) => {
        const patterns = song.chartPatterns;
        if (!patterns) return false;

        // 如果指定了难度，只检查该难度
        if (filters.chartPatternDifficulty !== 'all') {
          const diffPatterns = patterns[filters.chartPatternDifficulty];
          if (!diffPatterns) return false;
          return diffPatterns.some((p) => p.type === filters.chartPattern);
        }

        // 检查所有难度
        return Object.values(patterns).some((diffPatterns) =>
          diffPatterns?.some((p) => p.type === filters.chartPattern)
        );
      });
    }

    return result;
  }, [versionFilteredSongs, filters, fuse]);

  // Lazy loading - Intersection Observer for both card and list mode
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Load more items when trigger element comes into view
          setVisibleItemCount((prev) => {
            const nextCount = prev + BATCH_SIZE;
            return Math.min(nextCount, filteredSongs.length);
          });
        }
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Start loading before element is fully in view
        threshold: 0,
      }
    );

    const triggerElement = loadMoreTriggerRef.current;
    if (triggerElement) {
      observer.observe(triggerElement);
    }

    return () => {
      if (triggerElement) {
        observer.unobserve(triggerElement);
      }
    };
  }, [filteredSongs.length]);

  // Get visible items for both card and list mode
  const visibleItems = useMemo(() => {
    return filteredSongs.slice(0, visibleItemCount);
  }, [filteredSongs, visibleItemCount]);

  // Check if there are more items to load
  const hasMoreItems = visibleItemCount < filteredSongs.length;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navbar */}
      <Navbar
        selectedVersion={selectedVersion}
        onVersionChange={setSelectedVersion}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {/* Filter Bar - Sticky positioned */}
        <div className="sticky top-4 z-30 mb-6">
          <FilterBar filters={filters} onFiltersChange={setFilters} isDarkMode={isDarkMode} />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2
              className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              曲目列表
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filteredSongs.length} 首
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'card'
                  ? 'bg-pink-500 text-white shadow-md'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="卡片模式"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-pink-500 text-white shadow-md'
                  : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="列表模式"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Song List */}
        {filteredSongs.length > 0 ? (
          <div>
            {viewMode === 'list' ? (
              // List mode with lazy loading
              <div className="flex flex-col gap-2">
                {visibleItems.map((song) => (
                  <SongCard key={song.id} song={song} isDarkMode={isDarkMode} viewMode="list" />
                ))}
              </div>
            ) : (
              // Card mode with lazy loading
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleItems.map((song) => (
                  <SongCard key={song.id} song={song} isDarkMode={isDarkMode} viewMode="card" />
                ))}
              </div>
            )}
            {/* Load more trigger element - shared between both modes */}
            {hasMoreItems && (
              <div
                ref={loadMoreTriggerRef}
                className={`flex items-center justify-center py-8 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-sm ml-2">加载更多...</span>
                </div>
              </div>
            )}
            {/* Loaded all message */}
            {!hasMoreItems && filteredSongs.length > INITIAL_ITEM_COUNT && (
              <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                已加载全部 {filteredSongs.length} 首歌曲
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div
            className={`flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800/30'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <Music2
              className={`w-20 h-20 mb-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
            <h3
              className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              没有找到曲目
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              尝试调整筛选条件或搜索关键词
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`mt-20 py-8 border-t ${
          isDarkMode
            ? 'border-gray-800 bg-gray-900 text-gray-500'
            : 'border-gray-200 bg-gray-50 text-gray-400'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Jubeat Songs Database • 数据来源: BEMANI Wiki / atwiki
          </p>
          <p className="text-xs mt-2 opacity-60">
            Made with 💜 for jubeat players
          </p>
        </div>
      </footer>
    </div>
  );
}
