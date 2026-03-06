'use client';

import { useState, useMemo, useEffect } from 'react';
import { songs } from '@/data/songs';
import Fuse from 'fuse.js';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import SongCard from './components/SongCard';
import { Music2 } from 'lucide-react';

interface FilterState {
  search: string;
  firstAppearance: string;
  difficulty: 'all' | 'basic' | 'advanced' | 'extreme';
  minLevel: number | null;
  maxLevel: number | null;
  minNotes: number | null;
  maxNotes: number | null;
  artist: string;
  minBpm: number | null;
  maxBpm: number | null;
  isLicense: 'all' | 'license' | 'original';
  genre: string;
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  firstAppearance: '全部',
  difficulty: 'all',
  minLevel: null,
  maxLevel: null,
  minNotes: null,
  maxNotes: null,
  artist: '',
  minBpm: null,
  maxBpm: null,
  isLicense: 'all',
  genre: '全部',
};

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('all');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
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
  const versionFilteredSongs = useMemo(() => {
    if (selectedVersion === 'all') return songs;
    return songs.filter((song) => song.versionHistory?.includes(selectedVersion));
  }, [selectedVersion]);

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
      result = result.filter((song) => song.genre === filters.genre);
    }

    // firstAppearance filter
    if (filters.firstAppearance !== '全部') {
      result = result.filter((song) => song.firstAppearance === filters.firstAppearance);
    }

    // License filter
    if (filters.isLicense !== 'all') {
      result = result.filter((song) =>
        filters.isLicense === 'license' ? song.isLicense : !song.isLicense
      );
    }

    // Difficulty type and level filters
    if (filters.difficulty !== 'all') {
      const diffKey = filters.difficulty;
      result = result.filter((song) => {
        const level = song.difficulties[diffKey].level;
        if (filters.minLevel && level < filters.minLevel) return false;
        if (filters.maxLevel && level > filters.maxLevel) return false;
        return true;
      });
    } else if (filters.minLevel || filters.maxLevel) {
      // If no specific difficulty selected, check extreme by default
      result = result.filter((song) => {
        const level = song.difficulties.extreme.level;
        if (filters.minLevel && level < filters.minLevel) return false;
        if (filters.maxLevel && level > filters.maxLevel) return false;
        return true;
      });
    }

    // Notes range filter
    if (filters.minNotes || filters.maxNotes) {
      result = result.filter((song) => {
        const notes = song.difficulties.extreme.notes;
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

    return result;
  }, [versionFilteredSongs, filters, fuse]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.firstAppearance !== '全部') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.minLevel || filters.maxLevel) count++;
    if (filters.minNotes || filters.maxNotes) count++;
    if (filters.artist) count++;
    if (filters.minBpm || filters.maxBpm) count++;
    if (filters.isLicense !== 'all') count++;
    if (filters.genre !== '全部') count++;
    return count;
  }, [filters]);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Bar */}
        <div className="mb-6">
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
            {activeFilterCount > 0 && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium bg-pink-500 text-white`}
              >
                {activeFilterCount} 个筛选条件
              </span>
            )}
          </div>

          {/* Sort Options (placeholder for future) */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            按标题排序 (A-Z)
          </div>
        </div>

        {/* Song Grid */}
        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSongs.map((song) => (
              <SongCard key={song.id} song={song} isDarkMode={isDarkMode} />
            ))}
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
