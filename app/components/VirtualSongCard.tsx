'use client';

import { memo, CSSProperties } from 'react';
import { Song, DisplayDifficulty } from '@/lib/types';
import { ImageOff } from 'lucide-react';

// Extended song type with displayDifficulties
interface DisplaySong extends Song {
  displayDifficulties?: DisplayDifficulty;
}

interface VirtualSongCardProps {
  song: DisplaySong;
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
  'Ave.': 'bg-teal-500',
  'Beyond the Ave.': 'bg-pink-500',
  '音乐魔方': 'bg-red-600',
};

const GENRE_COLORS: Record<string, string> = {
  'ポップス': 'bg-pink-500',
  'アニメ': 'bg-orange-500',
  '東方アレンジ': 'bg-purple-500',
  'バラエティ': 'bg-green-500',
  'ナムコオリジナル': 'bg-blue-500',
  'コナミオリジナル': 'bg-red-500',
  'オリジナル': 'bg-indigo-500',
  'TV CM': 'bg-cyan-500',
  'TV CM洋楽': 'bg-cyan-600',
  '懐メロ': 'bg-amber-500',
  'TVドラマ': 'bg-teal-500',
  'TV ドラマ': 'bg-teal-500',
  'TV ドラマ・バラエティ': 'bg-teal-600',
  '洋楽': 'bg-blue-400',
  'クラシック': 'bg-yellow-600',
  'ソーシャルミュージック': 'bg-green-400',
  'ゲーム': 'bg-purple-400',
};

const GENRE_LABELS: Record<string, string> = {
  'ポップス': '流行',
  'アニメ': '动画',
  '東方アレンジ': '东方',
  'バラエティ': '综艺',
  'ナムコオリジナル': 'NAMCO',
  'コナミオリジナル': 'KONAMI',
  'オリジナル': '原创',
  'TV CM': '广告',
  'TV CM洋楽': '洋乐广告',
  '懐メロ': '怀旧',
  'TVドラマ': '剧集',
  'TV ドラマ': '剧集',
  'TV ドラマ・バラエティ': '剧综',
  '洋楽': '洋乐',
  'クラシック': '古典',
  'ソーシャルミュージック': '社交音乐',
  'ゲーム': '游戏',
  'VOCALOID': 'V家',
  'バラエティ懐メロ': '怀旧综艺',
  'TVドラマ懐メロ': '怀旧剧集',
  'TV ドラマ・バラエティ懐メロ': '怀旧综艺剧集',
};

function VirtualSongCard({ song, isDarkMode, viewMode, style }: VirtualSongCardProps) {
  const hasAvatar = song.avatar && song.avatar.length > 0;

  // Use version-specific difficulties if available, otherwise use first available version
  const difficulties = song.displayDifficulties || Object.values(song.versionDifficulties)[0];

  // List mode - compact horizontal layout
  if (viewMode === 'list') {
    return (
      <div
        style={style}
        className={`flex items-center gap-3 px-4 py-3 border-b transition-colors ${
          isDarkMode
            ? 'border-gray-700 hover:bg-gray-800/50'
            : 'border-gray-100 hover:bg-gray-50'
        }`}
      >
        {/* Cover */}
        <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden">
          {hasAvatar ? (
            <img
              src={song.avatar}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <ImageOff className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
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
            BPM {song.bpmRange}
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
            <DifficultyDot type="basic" level={difficulties.basic.level} />
            <DifficultyDot type="advanced" level={difficulties.advanced.level} />
            <DifficultyDot type="extreme" level={difficulties.extreme.level} />
          </div>

          {/* Desktop: Full badges */}
          <div className="hidden sm:flex items-center gap-3">
            <ListDifficultyBadge type="basic" level={difficulties.basic.level} isDarkMode={isDarkMode} />
            <ListDifficultyBadge type="advanced" level={difficulties.advanced.level} isDarkMode={isDarkMode} />
            <ListDifficultyBadge type="extreme" level={difficulties.extreme.level} isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    );
  }

  // Card mode
  return (
    <div
      style={style}
      className={`h-full p-3 rounded-xl border transition-all hover:shadow-md ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Cover */}
      <div className="relative w-full pb-[100%] mb-3 rounded-lg overflow-hidden">
        {hasAvatar ? (
          <img
            src={song.avatar}
            alt={song.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <ImageOff className={`w-8 h-8 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div className="mb-2">
        <h3
          className={`font-semibold text-sm line-clamp-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
          title={song.title}
        >
          {song.title}
        </h3>
        <p className={`text-xs truncate mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {song.artist}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        <Tag label={song.firstAppearance} colorClass={`${VERSION_COLORS[song.firstAppearance] || 'bg-slate-500'} text-white`} />
        <Tag label={`BPM ${song.bpmRange}`} colorClass="bg-blue-500 text-white" />
        {song.genre && (
          <Tag
            label={GENRE_LABELS[song.genre] || song.genre}
            colorClass={GENRE_COLORS[song.genre] || 'bg-gray-500'}
          />
        )}
      </div>

      {/* Difficulties */}
      <div className="grid grid-cols-3 gap-1">
        <CardDifficultyBadge type="basic" level={difficulties.basic.level} notes={difficulties.basic.notes} />
        <CardDifficultyBadge type="advanced" level={difficulties.advanced.level} notes={difficulties.advanced.notes} />
        <CardDifficultyBadge type="extreme" level={difficulties.extreme.level} notes={difficulties.extreme.notes} />
      </div>
    </div>
  );
}

// Simple colored dot with level
function DifficultyDot({ type, level }: { type: 'basic' | 'advanced' | 'extreme'; level: number }) {
  const colors = DIFFICULTY_COLORS[type];

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colors.bg}`}
      title={`${type}: ${level}`}
    >
      {Math.floor(level)}
    </div>
  );
}

// List view difficulty badge
function ListDifficultyBadge({
  type,
  level,
  isDarkMode,
}: {
  type: 'basic' | 'advanced' | 'extreme';
  level: number;
  isDarkMode: boolean;
}) {
  const colors = DIFFICULTY_COLORS[type];

  return (
    <div className="flex items-center gap-1">
      <span className={`text-[10px] font-medium w-8 ${colors.text} ${type === 'extreme' ? 'text-red-500' : ''}`}>
        {type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT'}
      </span>
      <span className={`font-bold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {level}
      </span>
    </div>
  );
}

// Card view difficulty badge with notes
function CardDifficultyBadge({
  type,
  level,
  notes,
}: {
  type: 'basic' | 'advanced' | 'extreme';
  level: number;
  notes?: number;
}) {
  const colors = DIFFICULTY_COLORS[type];

  return (
    <div className={`${colors.bg} rounded-lg px-2 py-1.5 text-center`}>
      <div className="text-[10px] text-white/80 font-medium">
        {type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT'}
      </div>
      <div className="text-sm font-bold text-white leading-tight">
        {level}
      </div>
      {notes !== undefined && (
        <div className="text-[9px] text-white/70 leading-tight">
          {notes}
        </div>
      )}
    </div>
  );
}

// Tag component
function Tag({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

export default memo(VirtualSongCard);
