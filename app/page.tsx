'use client';

import { useState, useMemo } from 'react';
import { songs, allGenres } from '@/data/songs';
import { GENRE_COLORS, GENRE_LABELS, VERSIONS, VERSION_LABELS } from '@/lib/types';
import Fuse from 'fuse.js';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全部');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // 模糊搜索配置
  const fuse = useMemo(() => {
    return new Fuse(songs, {
      keys: ['title', 'artist'],
      threshold: 0.3,
    });
  }, []);

  // 筛选逻辑 - 使用 versionHistory
  const filteredSongs = useMemo(() => {
    let result = songs;

    // 搜索筛选
    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map((item) => item.item);
    }

    // 分类筛选
    if (selectedGenre !== '全部') {
      result = result.filter((song) => song.genre === selectedGenre);
    }

    // 版本筛选 - 使用 versionHistory
    if (selectedVersion !== null) {
      result = result.filter(
        (song) => song.versionHistory?.includes(selectedVersion)
      );
    }

    // 难度筛选 (EXTREME 等级)
    if (selectedLevel !== null) {
      result = result.filter(
        (song) => Math.floor(song.difficulties.extreme.level) === selectedLevel
      );
    }

    return result;
  }, [searchQuery, selectedGenre, selectedVersion, selectedLevel, fuse]);

  const getDifficultyColor = (level: number) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-yellow-500';
    if (level <= 8) return 'bg-orange-500';
    if (level < 10) return 'bg-red-500';
    return 'bg-purple-600';
  };

  const allLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Jubeat 曲目查询
        </h1>
        <p className="text-gray-600">jubeat 全版本曲目数据库 | 共 {songs.length} 首曲目</p>
      </header>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="搜索歌曲名、艺术家..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-purple-500 text-white border-purple-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            筛选 {showFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-white rounded-lg shadow-md">
          {/* Version Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">版本（显示该版本存在过的所有曲目）</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedVersion === null
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部版本
              </button>
              {VERSIONS.map((version) => (
                <button
                  key={version}
                  onClick={() => setSelectedVersion(version)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedVersion === version
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {VERSION_LABELS[version] || version}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">分类</h3>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedGenre === genre
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {GENRE_LABELS[genre] || genre}
                </button>
              ))}
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">EXTREME 难度</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLevel(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedLevel === null
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {allLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedLevel === level
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Lv.{level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="max-w-6xl mx-auto mb-4 text-gray-600">
        显示 {filteredSongs.length} 首曲目
        {selectedVersion && (
          <span className="ml-2 text-purple-600">
            ({VERSION_LABELS[selectedVersion]} 版本)
          </span>
        )}
      </div>

      {/* Song Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSongs.map((song) => (
          <div
            key={song.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between mb-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs text-white ${
                    GENRE_COLORS[song.genre] || 'bg-gray-500'
                  }`}
                >
                  {GENRE_LABELS[song.genre] || song.genre}
                </span>
                <span className="text-xs text-gray-400">{song.firstAppearance}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{song.title}</h3>
              <p className="text-sm text-gray-600">{song.artist}</p>
              <div className="mt-1 text-xs text-gray-400">
                BPM {song.bpm} 
                {song.deletedIn && (
                  <span className="text-red-400 ml-2">⚠ 删除于 {song.deletedIn}</span>
                )}
              </div>
            </div>

            {/* Difficulties */}
            <div className="grid grid-cols-3 divide-x">
              {/* BASIC */}
              <div className="p-3 text-center bg-green-50">
                <div className="text-xs text-gray-500 mb-1">BASIC</div>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mb-1 ${getDifficultyColor(
                    song.difficulties.basic.level
                  )}`}
                >
                  {song.difficulties.basic.level}
                </div>
                <div className="text-xs text-gray-600">
                  {song.difficulties.basic.notes}🎵
                </div>
              </div>

              {/* ADVANCED */}
              <div className="p-3 text-center bg-yellow-50">
                <div className="text-xs text-gray-500 mb-1">ADVANCED</div>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mb-1 ${getDifficultyColor(
                    song.difficulties.advanced.level
                  )}`}
                >
                  {song.difficulties.advanced.level}
                </div>
                <div className="text-xs text-gray-600">
                  {song.difficulties.advanced.notes}🎵
                </div>
              </div>

              {/* EXTREME */}
              <div className="p-3 text-center bg-red-50">
                <div className="text-xs text-gray-500 mb-1">EXTREME</div>
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold mb-1 ${getDifficultyColor(
                    song.difficulties.extreme.level
                  )}`}
                >
                  {song.difficulties.extreme.level}
                </div>
                <div className="text-xs text-gray-600">
                  {song.difficulties.extreme.notes}🎵
                </div>
                {song.difficulties.extreme.rating && (
                  <div className="text-xs text-red-600 font-semibold mt-1">
                    ⚠ {song.difficulties.extreme.rating}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSongs.length === 0 && (
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">没有找到曲目</h3>
          <p className="text-gray-500">尝试调整筛选条件或搜索关键词</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <p>Jubeat 曲目查询系统 | 数据来源: BEMANI Wiki</p>
        <p className="mt-1">Built with 🦊 by 小能子 for 饲养员大人</p>
      </footer>
    </main>
  );
}
