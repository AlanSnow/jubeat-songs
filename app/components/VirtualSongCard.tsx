'use client';

import { memo, CSSProperties } from 'react';
import { Song } from '@/lib/types';
import { ImageOff } from 'lucide-react';

interface VirtualSongCardProps {
  song: Song;
  isDarkMode: boolean;
  viewMode: 'card' | 'list';
  style?: CSSProperties;
}

// jubeat difficulty colors
const DIFFICULTY_COLORS = {
  basic: {
    bg: 'bg-[#7CB342]',
    text: 'text-[#558B2F]',
  },
  advanced: {
    bg: 'bg-[#FBC02D]',
    text: 'text-[#F57F17]',
  },
  extreme: {
    bg: 'bg-[#E53935]',
    text: 'text-[#C62828]',
  },
};

// 版本颜色映射 - 为每个 jubeat 版本分配独特颜色
const VERSION_COLORS: Record<string, string> = {
  'jubeat': 'bg-slate-500',
  'ripples': 'bg-sky-500',
  'knit': 'bg-violet-500',
  'copious': 'bg-emerald-500',
  'saucer': 'bg-amber-500',
  'saucer fulfill': 'bg-orange-500',
  'prop': 'bg-indigo-500',
  'Qubell': 'bg-fuchsia-500',
  'clan': 'bg-rose-500',
  'festo': 'bg-cyan-500',
  'Ave.': 'bg-pink-500',
  'Beyond the Ave.': 'bg-purple-600',
};

// Genre colors
const GENRE_COLORS: Record<string, string> = {
  'ポップス': 'bg-pink-500',
  'アニメ': 'bg-orange-500',
  '東方アレンジ': 'bg-purple-500',
  'バラエティ': 'bg-green-500',
  'ナムコオリジナル': 'bg-blue-500',
  'コナミオリジナル': 'bg-red-500',
};

const GENRE_LABELS: Record<string, string> = {
  'ポップス': '流行',
  'アニメ': '动漫',
  '東方アレンジ': '东方',
  'バラエティ': '综艺',
  'ナムコオリジナル': 'NAMCO原创',
  'コナミオリジナル': 'KONAMI原创',
};

// Memoized for performance in virtual scrolling
function VirtualSongCard({ song, isDarkMode, viewMode, style }: VirtualSongCardProps) {
  const hasAvatar = song.avatar && song.avatar.length > 0;

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
          isDarkMode
            ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        }`}
        style={style}
      >
        {/* Cover */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
          {hasAvatar ? (
            <img
              src={song.avatar}
              alt={song.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <ImageOff className={`w-5 h-5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {song.title}
          </h3>
          <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {song.artist}
          </p>
        </div>

        {/* Tags: 来源、BPM、Genre */}
        <div className="flex items-center gap-1.5 flex-shrink-0 hidden sm:flex">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${VERSION_COLORS[song.firstAppearance] || 'bg-slate-500'}`}>
            {song.firstAppearance}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white bg-blue-500">
            BPM {song.bpm}
          </span>
          {song.genre && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${
                GENRE_COLORS[song.genre] || 'bg-gray-500'
              }`}
            >
              {GENRE_LABELS[song.genre] || song.genre}
            </span>
          )}
          {song.deletedIn && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500 text-white">
              Deleted
            </span>
          )}
        </div>

        {/* Difficulties */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: Just colored circles */}
          <div className="flex items-center gap-1 sm:hidden">
            <DifficultyDot type="basic" level={song.difficulties.basic.level} />
            <DifficultyDot type="advanced" level={song.difficulties.advanced.level} />
            <DifficultyDot type="extreme" level={song.difficulties.extreme.level} />
          </div>

          {/* Desktop: Full badges */}
          <div className="hidden sm:flex items-center gap-3">
            <ListDifficultyBadge type="basic" level={song.difficulties.basic.level} />
            <ListDifficultyBadge type="advanced" level={song.difficulties.advanced.level} />
            <ListDifficultyBadge type="extreme" level={song.difficulties.extreme.level} />
          </div>
        </div>
      </div>
    );
  }

  // Card mode
  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isDarkMode
          ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
          : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
      style={style}
    >
      {/* Cover Image - 1:1 Aspect Ratio */}
      <div className="relative aspect-square overflow-hidden">
        {hasAvatar ? (
          <img
            src={song.avatar}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <ImageOff className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No Cover</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3">
        {/* Title & Artist */}
        <div className="mb-2">
          <h3 className={`font-bold text-sm leading-tight line-clamp-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {song.title}
          </h3>
          <p className={`text-xs truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {song.artist}
          </p>
        </div>

        {/* Tags Row: 来源、BPM、Genre */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Tag label={song.firstAppearance} colorClass={`${VERSION_COLORS[song.firstAppearance] || 'bg-slate-500'} text-white`} />
          <Tag label={`BPM ${song.bpm}`} colorClass="bg-blue-500 text-white" />
          {song.genre && <Tag label={GENRE_LABELS[song.genre] || song.genre} colorClass={GENRE_COLORS[song.genre] || 'bg-gray-500'} />}
          {song.deletedIn && <Tag label="Deleted" colorClass="bg-red-500" />}
        </div>

        {/* Difficulties */}
        <div className="grid grid-cols-3 gap-1">
          <CardDifficultyBadge type="basic" level={song.difficulties.basic.level} notes={song.difficulties.basic.notes} />
          <CardDifficultyBadge type="advanced" level={song.difficulties.advanced.level} notes={song.difficulties.advanced.notes} />
          <CardDifficultyBadge type="extreme" level={song.difficulties.extreme.level} notes={song.difficulties.extreme.notes} />
        </div>
      </div>
    </div>
  );
}

// Simple colored dot for mobile
function DifficultyDot({ type, level }: { type: 'basic' | 'advanced' | 'extreme'; level: number }) {
  const colors = DIFFICULTY_COLORS[type];
  return (
    <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
      <span className="text-white text-[10px] font-bold">{level}</span>
    </div>
  );
}

// List mode difficulty badge
function ListDifficultyBadge({ type, level }: { type: 'basic' | 'advanced' | 'extreme'; level: number }) {
  const colors = DIFFICULTY_COLORS[type];
  const label = type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT';

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs font-bold ${colors.text}`}>{label}</span>
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold text-xs ${colors.bg}`}>
        {level}
      </span>
    </div>
  );
}

// Card mode difficulty badge
function CardDifficultyBadge({ type, level, notes }: { type: 'basic' | 'advanced' | 'extreme'; level: number; notes: number }) {
  const colors = DIFFICULTY_COLORS[type];
  const label = type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT';

  const bgLightClass = type === 'basic' ? 'bg-[#7CB342]/10 border-[#7CB342]/30' :
                       type === 'advanced' ? 'bg-[#FBC02D]/10 border-[#FBC02D]/30' :
                       'bg-[#E53935]/10 border-[#E53935]/30';

  return (
    <div className={`flex flex-col items-center py-2 rounded-lg border ${bgLightClass}`}>
      <span className={`text-[10px] font-bold uppercase ${colors.text}`}>{label}</span>
      <span className={`text-lg font-bold ${colors.text} leading-tight my-0.5`}>{level}</span>
      <span className="text-[10px] text-gray-500">{notes}N</span>
    </div>
  );
}

// Tag component
function Tag({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${colorClass}`}>
      {label}
    </span>
  );
}

// Export memoized version for virtual scrolling performance
export default memo(VirtualSongCard, (prev, next) => {
  return (
    prev.song.id === next.song.id &&
    prev.isDarkMode === next.isDarkMode &&
    prev.viewMode === next.viewMode
  );
});
