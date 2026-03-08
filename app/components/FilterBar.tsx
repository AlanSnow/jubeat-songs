'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Check, Music } from 'lucide-react';
import { GENRE_LABELS } from '@/lib/types';

export interface FilterState {
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
  genre: string;
  chartPattern: 'all' | 'sahyou' | 'gyakusahyou' | 'kojinsa';
  chartPatternDifficulty: 'all' | 'basic' | 'advanced' | 'extreme';
}

export const INITIAL_FILTERS: FilterState = {
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
  genre: '全部',
  chartPattern: 'all',
  chartPatternDifficulty: 'all',
};

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  isDarkMode: boolean;
}

const GENRES = ['全部', '未分类', 'アニメ', '東方アレンジ', 'バラエティ', 'ナムコオリジナル', 'コナミオリジナル', 'オリジナル', 'TV CM', '懐メロ', 'TVドラマ', 'TV ドラマ・バラエティ', '洋楽', 'クラシック', 'ソーシャルミュージック'];

const VERSIONS = ['全部', 'jubeat', 'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.', '音乐魔方'];

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 计算活跃过滤条件数量
function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.firstAppearance !== '全部') count++;
  if (filters.difficulty !== 'all') count++;
  if (filters.minLevel || filters.maxLevel) count++;
  if (filters.minNotes || filters.maxNotes) count++;
  if (filters.artist) count++;
  if (filters.minBpm || filters.maxBpm) count++;
  if (filters.genre !== '全部') count++;
  if (filters.chartPattern !== 'all') count++;
  if (filters.chartPatternDifficulty !== 'all') count++;
  return count;
}

export default function FilterBar({ filters, onFiltersChange, isDarkMode }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterState>(filters);
  const [isAnimating, setIsAnimating] = useState(false);

  const activeCount = getActiveFilterCount(filters);

  // 同步外部 filters 变化到 tempFilters
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // 处理打开弹窗
  const handleOpen = () => {
    setTempFilters(filters);
    setIsOpen(true);
    setIsAnimating(true);
  };

  // 处理关闭弹窗
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // 确认应用过滤条件
  const handleApply = () => {
    onFiltersChange(tempFilters);
    handleClose();
  };

  // 重置过滤条件
  const handleReset = () => {
    setTempFilters(INITIAL_FILTERS);
  };

  // 更新临时过滤条件
  const updateTempFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // 清除搜索
  const clearSearch = () => {
    onFiltersChange({ ...filters, search: '' });
  };

  const inputClass = `px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
    isDarkMode
      ? 'bg-gray-800/80 border-gray-600 text-white placeholder-gray-500'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
  }`;

  const selectClass = `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-gray-50 border-gray-200 text-gray-900'
  }`;

  const labelClass = `text-xs font-medium mb-1.5 block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;

  return (
    <>
      {/* 主搜索栏 */}
      <div className={`transition-all duration-300 ${isOpen ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className={`rounded-2xl border shadow-sm backdrop-blur-sm ${
          isDarkMode
            ? 'bg-gray-800/90 border-gray-700'
            : 'bg-white/90 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 p-2">
            {/* 搜索输入框 */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="搜索歌曲名、艺术家..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className={`${inputClass} w-full pl-10 pr-8 py-2.5`}
              />
              {filters.search && (
                <button
                  onClick={clearSearch}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 更多按钮 */}
            <button
              onClick={handleOpen}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCount > 0
                  ? 'bg-pink-500 text-white shadow-md hover:bg-pink-600'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">筛选</span>
              {activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/* 活跃过滤条件标签 */}
          {activeCount > 0 && (
            <div className={`px-3 pb-2 flex flex-wrap gap-1.5 ${filters.search ? '' : 'pt-2'}`}>
              {filters.genre !== '全部' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  {GENRE_LABELS[filters.genre] || filters.genre}
                </span>
              )}
              {filters.firstAppearance !== '全部' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                }`}>
                  {filters.firstAppearance}
                </span>
              )}
              {(filters.minLevel || filters.maxLevel) && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Lv.{filters.minLevel || 1}-{filters.maxLevel || 10}
                </span>
              )}
              {filters.difficulty !== 'all' && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                }`}>
                  {filters.difficulty === 'basic' ? 'BSC' : filters.difficulty === 'advanced' ? 'ADV' : 'EXT'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-200 ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
        >
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} backdrop-blur-sm`} />
        </div>
      )}

      {/* PC端弹窗 / 移动端抽屉 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          {/* PC端弹窗 */}
          <div
            className={`hidden md:block pointer-events-auto w-full max-w-2xl mx-4 transition-all duration-200 ${
              isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className={`rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {/* 弹窗头部 */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  筛选条件
                </h3>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className={`p-6 overflow-y-auto max-h-[60vh] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <FilterContent
                  tempFilters={tempFilters}
                  updateTempFilter={updateTempFilter}
                  isDarkMode={isDarkMode}
                  selectClass={selectClass}
                  labelClass={labelClass}
                />
              </div>

              {/* 弹窗底部 */}
              <div className={`flex items-center justify-between px-6 py-4 border-t ${
                isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
              }`}>
                <button
                  onClick={handleReset}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  重置
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleApply}
                    className="px-6 py-2 rounded-lg text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-md"
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 移动端抽屉 */}
          <div
            className={`md:hidden pointer-events-auto fixed inset-x-0 bottom-0 transition-all duration-300 ${
              isAnimating ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className={`rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* 抽屉头部 */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  筛选条件
                </h3>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 抽屉指示条 */}
              <div className="flex justify-center py-2">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
              </div>

              {/* 抽屉内容 */}
              <div className={`px-5 pb-24 overflow-y-auto max-h-[70vh] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <FilterContent
                  tempFilters={tempFilters}
                  updateTempFilter={updateTempFilter}
                  isDarkMode={isDarkMode}
                  selectClass={selectClass}
                  labelClass={labelClass}
                />
              </div>

              {/* 抽屉底部固定按钮 */}
              <div className={`fixed bottom-0 left-0 right-0 px-5 py-4 border-t ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800/95 backdrop-blur-sm'
                  : 'border-gray-200 bg-white/95 backdrop-blur-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    重置
                  </button>
                  <button
                    onClick={handleApply}
                    className="flex-[2] px-4 py-3 rounded-xl text-sm font-medium bg-pink-500 text-white hover:bg-pink-600 transition-colors shadow-md"
                  >
                    确认筛选
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 过滤内容组件
interface FilterContentProps {
  tempFilters: FilterState;
  updateTempFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  isDarkMode: boolean;
  selectClass: string;
  labelClass: string;
}

function FilterContent({ tempFilters, updateTempFilter, isDarkMode, selectClass, labelClass }: FilterContentProps) {
  return (
    <div className="space-y-5">
      {/* 艺术家搜索 */}
      <div>
        <label className={labelClass}>艺术家</label>
        <div className="relative">
          <Music className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="搜索艺术家..."
            value={tempFilters.artist}
            onChange={(e) => updateTempFilter('artist', e.target.value)}
            className={`${selectClass} pl-9`}
          />
        </div>
      </div>

      {/* 版本和Genre */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>来源版本</label>
          <select
            value={tempFilters.firstAppearance}
            onChange={(e) => updateTempFilter('firstAppearance', e.target.value)}
            className={selectClass}
          >
            {VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v === '全部' ? '全部版本' : v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>分类</label>
          <select
            value={tempFilters.genre}
            onChange={(e) => updateTempFilter('genre', e.target.value)}
            className={selectClass}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {GENRE_LABELS[g] || g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 难度类型 */}
      <div>
        <label className={labelClass}>难度类型</label>
        <div className="flex gap-2">
          {(['all', 'basic', 'advanced', 'extreme'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => updateTempFilter('difficulty', diff)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex-1 transition-all ${
                tempFilters.difficulty === diff
                  ? 'bg-pink-500 text-white shadow-md'
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

      {/* 等级范围 */}
      <div>
        <label className={labelClass}>等级范围</label>
        <div className="flex gap-2 items-center">
          <select
            value={tempFilters.minLevel || ''}
            onChange={(e) => updateTempFilter('minLevel', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Min</option>
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>Lv.{l}</option>
            ))}
          </select>
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
          <select
            value={tempFilters.maxLevel || ''}
            onChange={(e) => updateTempFilter('maxLevel', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Max</option>
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>Lv.{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* BPM范围 */}
      <div>
        <label className={labelClass}>BPM 范围</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={tempFilters.minBpm || ''}
            onChange={(e) => updateTempFilter('minBpm', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          />
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={tempFilters.maxBpm || ''}
            onChange={(e) => updateTempFilter('maxBpm', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Notes范围 */}
      <div>
        <label className={labelClass}>Notes 范围</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={tempFilters.minNotes || ''}
            onChange={(e) => updateTempFilter('minNotes', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          />
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={tempFilters.maxNotes || ''}
            onChange={(e) => updateTempFilter('maxNotes', e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          />
        </div>
      </div>

      {/* 谱面标记 */}
      <div>
        <label className={labelClass}>谱面标记</label>
        <div className="flex flex-col gap-2">
          <select
            value={tempFilters.chartPattern}
            onChange={(e) => updateTempFilter('chartPattern', e.target.value as FilterState['chartPattern'])}
            className={selectClass}
          >
            <option value="all">全部谱面</option>
            <option value="sahyou">⚠️ 诈称 (实际更难)</option>
            <option value="gyakusahyou">✓ 逆诈称 (实际更简单)</option>
            <option value="kojinsa">👤 个人差 (因人而异)</option>
          </select>
          {tempFilters.chartPattern !== 'all' && (
            <select
              value={tempFilters.chartPatternDifficulty}
              onChange={(e) => updateTempFilter('chartPatternDifficulty', e.target.value as FilterState['chartPatternDifficulty'])}
              className={`${selectClass} text-xs`}
            >
              <option value="all">所有难度</option>
              <option value="basic">BSC</option>
              <option value="advanced">ADV</option>
              <option value="extreme">EXT</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
