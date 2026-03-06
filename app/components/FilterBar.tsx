'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, Music } from 'lucide-react';
import { GENRE_LABELS } from '@/lib/types';

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

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isDarkMode: boolean;
}

const GENRES = ['全部', 'ポップス', 'アニメ', '東方アレンジ', 'バラエティ', 'ナムコオリジナル', 'コナミオリジナル'];

const VERSIONS = ['全部', 'jubeat', 'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.'];

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function FilterBar({ filters, onFiltersChange, isDarkMode }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
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
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.firstAppearance !== '全部' ||
    filters.difficulty !== 'all' ||
    filters.minLevel ||
    filters.maxLevel ||
    filters.minNotes ||
    filters.maxNotes ||
    filters.artist ||
    filters.minBpm ||
    filters.maxBpm ||
    filters.isLicense !== 'all' ||
    filters.genre !== '全部';

  const inputClass = `px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors ${
    isDarkMode
      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  }`;

  const selectClass = `px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors appearance-none ${
    isDarkMode
      ? 'bg-gray-800 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelClass = `text-sm font-medium mb-1.5 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} shadow-lg`}>
      {/* Main Search Row */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="搜索歌曲名、艺术家..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className={`${inputClass} w-full pl-10`}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <select
                value={filters.genre}
                onChange={(e) => updateFilter('genre', e.target.value)}
                className={selectClass}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {GENRE_LABELS[g] || g}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filters.firstAppearance}
                onChange={(e) => updateFilter('firstAppearance', e.target.value)}
                className={selectClass}
                title="筛选歌曲首次出现的版本"
              >
                {VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v === '全部' ? '来源版本' : v}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={filters.isLicense}
                onChange={(e) => updateFilter('isLicense', e.target.value as FilterState['isLicense'])}
                className={selectClass}
              >
                <option value="all">全部</option>
                <option value="license">版权曲</option>
                <option value="original">原创曲</option>
              </select>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                showAdvanced
                  ? 'bg-pink-500 text-white border-pink-500'
                  : isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              高级筛选
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <X className="w-4 h-4" />
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className={`p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          {/* Difficulty Type */}
          <div>
            <label className={labelClass}>难度类型</label>
            <div className="flex gap-2">
              {(['all', 'basic', 'advanced', 'extreme'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => updateFilter('difficulty', diff)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex-1 transition-colors ${
                    filters.difficulty === diff
                      ? 'bg-pink-500 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diff === 'all' ? '全部' : diff === 'basic' ? 'BSC' : diff === 'advanced' ? 'ADV' : 'EXT'}
                </button>
              ))}
            </div>
          </div>

          {/* Level Range */}
          <div>
            <label className={labelClass}>等级范围</label>
            <div className="flex gap-2 items-center">
              <select
                value={filters.minLevel || ''}
                onChange={(e) => updateFilter('minLevel', e.target.value ? Number(e.target.value) : null)}
                className={`${selectClass} flex-1`}
              >
                <option value="">Min</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>Lv.{l}</option>
                ))}
              </select>
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
              <select
                value={filters.maxLevel || ''}
                onChange={(e) => updateFilter('maxLevel', e.target.value ? Number(e.target.value) : null)}
                className={`${selectClass} flex-1`}
              >
                <option value="">Max</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>Lv.{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Range */}
          <div>
            <label className={labelClass}>Notes 范围</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.minNotes || ''}
                onChange={(e) => updateFilter('minNotes', e.target.value ? Number(e.target.value) : null)}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxNotes || ''}
                onChange={(e) => updateFilter('maxNotes', e.target.value ? Number(e.target.value) : null)}
                className={`${inputClass} flex-1 min-w-0`}
              />
            </div>
          </div>

          {/* BPM Range */}
          <div>
            <label className={labelClass}>BPM 范围</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={filters.minBpm || ''}
                onChange={(e) => updateFilter('minBpm', e.target.value ? Number(e.target.value) : null)}
                className={`${inputClass} flex-1 min-w-0`}
              />
              <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxBpm || ''}
                onChange={(e) => updateFilter('maxBpm', e.target.value ? Number(e.target.value) : null)}
                className={`${inputClass} flex-1 min-w-0`}
              />
            </div>
          </div>

          {/* Artist Search */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className={labelClass}>艺术家</label>
            <div className="relative">
              <Music className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="搜索艺术家..."
                value={filters.artist}
                onChange={(e) => updateFilter('artist', e.target.value)}
                className={`${inputClass} w-full pl-9`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
