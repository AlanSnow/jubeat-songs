'use client';

import { Song } from '@/lib/types';
import { ImageOff } from 'lucide-react';

interface SongCardProps {
  song: Song & { displayDifficulties?: Song['difficulties'] };
  isDarkMode: boolean;
  viewMode?: 'card' | 'list';
}

// jubeat difficulty colors - green, yellow, red (solid backgrounds with contrasting text)
const DIFFICULTY_COLORS = {
  basic: {
    bg: 'bg-green-500',
    bgSolid: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-green-700',
    textOnBg: 'text-white',
  },
  advanced: {
    bg: 'bg-yellow-500',
    bgSolid: 'bg-yellow-500',
    border: 'border-yellow-600',
    text: 'text-yellow-800',
    textOnBg: 'text-yellow-900',
  },
  extreme: {
    bg: 'bg-red-500',
    bgSolid: 'bg-red-500',
    border: 'border-red-600',
    text: 'text-red-700',
    textOnBg: 'text-white',
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

// Genre colors - 支持标准分类和 atwiki 具体分类
const GENRE_COLORS: Record<string, string> = {
  // 标准分类
  'ポップス': 'bg-pink-500',
  'アニメ': 'bg-orange-500',
  '東方アレンジ': 'bg-purple-500',
  'バラエティ': 'bg-green-500',
  'ナムコオリジナル': 'bg-blue-500',
  'コナミオリジナル': 'bg-red-500',
  // atwiki 具体分类映射
  'オリジナル': 'bg-indigo-500',
  'TV CM': 'bg-cyan-500',
  'TV CM洋楽': 'bg-cyan-600',
  '懐メロ': 'bg-amber-500',
  'TVドラマ': 'bg-teal-500',
  'TV ドラマ': 'bg-teal-500',
  'TV ドラマ・バラエティ': 'bg-teal-600',
  '洋楽': 'bg-blue-400',
  'クラシック': 'bg-yellow-600',
  'ソーシャルミュージック': 'bg-rose-500',
  'アニメ懐メロ': 'bg-orange-400',
  'バラエティ懐メロ': 'bg-green-400',
  'TVドラマ懐メロ': 'bg-teal-400',
  'TV ドラマ・バラエティ懐メロ': 'bg-teal-700',
};

const GENRE_LABELS: Record<string, string> = {
  // 标准分类
  'ポップス': '流行',
  'アニメ': '动漫',
  '東方アレンジ': '东方',
  'バラエティ': '综艺',
  'ナムコオリジナル': 'NAMCO原创',
  'コナミオリジナル': 'KONAMI原创',
  // atwiki 具体分类
  'オリジナル': '原创',
  'TV CM': '广告曲',
  'TV CM洋楽': '洋乐广告',
  '懐メロ': '怀旧金曲',
  'TVドラマ': '电视剧',
  'TV ドラマ': '电视剧',
  'TV ドラマ・バラエティ': '综艺剧集',
  '洋楽': '洋乐',
  'クラシック': '古典',
  'ソーシャルミュージック': '社交音乐',
  'アニメ懐メロ': '怀旧动漫',
  'バラエティ懐メロ': '怀旧综艺',
  'TVドラマ懐メロ': '怀旧剧集',
  'TV ドラマ・バラエティ懐メロ': '怀旧综艺剧集',
};

export default function SongCard({ song, isDarkMode, viewMode = 'card' }: SongCardProps) {
  const hasAvatar = song.avatar && song.avatar.length > 0;

  // Use version-specific difficulties if available, otherwise use first available version
  const difficulties = song.displayDifficulties || Object.values(song.versionDifficulties)[0];

  // List Mode - Horizontal layout with responsive design
  if (viewMode === 'list') {
    return (
      <div
        className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
          isDarkMode
            ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
            : 'bg-white border border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Cover - Fixed 1:1, small size */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
          {hasAvatar ? (
            <img
              src={song.avatar}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <ImageOff className={`w-5 h-5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
          )}
        </div>

        {/* Title & Artist - Always visible, takes priority */}
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

        {/* Difficulties - Compact on mobile, detailed on desktop */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: Just colored circles with level */}
          <div className="flex items-center gap-1 sm:hidden">
            <DifficultyDot type="basic" level={difficulties.basic.level} />
            <DifficultyDot type="advanced" level={difficulties.advanced.level} />
            <DifficultyDot type="extreme" level={difficulties.extreme.level} />
          </div>

          {/* Desktop: Full badges */}
          <div className="hidden sm:flex items-center gap-3">
            <ListDifficultyBadge
              type="basic"
              level={difficulties.basic.level}
              patterns={song.chartPatterns?.basic}
            />
            <ListDifficultyBadge
              type="advanced"
              level={difficulties.advanced.level}
              patterns={song.chartPatterns?.advanced}
            />
            <ListDifficultyBadge
              type="extreme"
              level={difficulties.extreme.level}
              patterns={song.chartPatterns?.extreme}
            />
          </div>
        </div>
      </div>
    );
  }

  // Card Mode - Vertical layout with 1:1 cover
  return (
    <div
      className={`group rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
        isDarkMode
          ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
          : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
      }`}
    >
      {/* Cover Image - 1:1 Aspect Ratio */}
      <div className="relative aspect-square overflow-hidden">
        {hasAvatar ? (
          <img
            src={song.avatar}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className={`w-full h-full flex flex-col items-center justify-center ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}
          >
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
          <Tag label={`BPM ${song.bpmRange}`} colorClass="bg-blue-500 text-white" />
          {song.genre && (
            <Tag
              label={GENRE_LABELS[song.genre] || song.genre}
              colorClass={GENRE_COLORS[song.genre] || 'bg-gray-500'}
            />
          )}
          {song.deletedIn && (
            <Tag label="Deleted" colorClass="bg-red-500" />
          )}
        </div>

        {/* Difficulties - Full width, three columns */}
        <div className="grid grid-cols-3 gap-1">
          <CardDifficultyBadge
            type="basic"
            level={difficulties.basic.level}
            patterns={song.chartPatterns?.basic}
          />
          <CardDifficultyBadge
            type="advanced"
            level={difficulties.advanced.level}
            patterns={song.chartPatterns?.advanced}
          />
          <CardDifficultyBadge
            type="extreme"
            level={difficulties.extreme.level}
            patterns={song.chartPatterns?.extreme}
          />
        </div>
      </div>
    </div>
  );
}

// Simple colored dot with level for mobile list view
function DifficultyDot({ type, level }: { type: 'basic' | 'advanced' | 'extreme'; level: number }) {
  const colors = DIFFICULTY_COLORS[type];

  return (
    <div className={`flex flex-col items-center`}>
      <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center`}>
        <span className="text-white text-[10px] font-bold">{level}</span>
      </div>
    </div>
  );
}

// Helper component for displaying chart pattern markers
function PatternMarkers({
  patterns,
  className = '',
}: {
  patterns?: { type: string; label?: string; description?: string }[];
  className?: string;
}) {
  if (!patterns || patterns.length === 0) return null;

  // 只显示评级标记 (诈称/逆诈称/个人差)
  const ratingPatterns = patterns.filter(
    (p) => p.type === 'sahyou' || p.type === 'gyakusahyou' || p.type === 'kojinsa'
  );

  if (ratingPatterns.length === 0) return null;

  return (
    <span className={`inline-flex gap-0.5 ${className}`}>
      {ratingPatterns.map((pattern, idx) => (
        <span
          key={idx}
          className={`text-[10px] px-1 rounded font-bold border ${
            pattern.type === 'sahyou'
              ? 'bg-white border-red-500 text-red-600'
              : pattern.type === 'gyakusahyou'
              ? 'bg-white border-blue-500 text-blue-600'
              : 'bg-white border-purple-500 text-purple-600'
          }`}
          title={pattern.label}
        >
          {pattern.type === 'sahyou' ? '诈' : pattern.type === 'gyakusahyou' ? '逆' : '差'}
        </span>
      ))}
    </span>
  );
}

// Helper component for List Mode difficulty badge
function ListDifficultyBadge({
  type,
  level,
  patterns,
}: {
  type: 'basic' | 'advanced' | 'extreme';
  level: number;
  patterns?: { type: string; label?: string; description?: string }[];
}) {
  const colors = DIFFICULTY_COLORS[type];
  const label = type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-bold ${colors.text}`}>{label}</span>
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${colors.bgSolid} ${colors.textOnBg}`}>
        {level}
      </span>
      <PatternMarkers patterns={patterns} />
    </div>
  );
}

// Helper component for Card Mode difficulty badge
function CardDifficultyBadge({
  type,
  level,
  patterns,
}: {
  type: 'basic' | 'advanced' | 'extreme';
  level: number;
  patterns?: { type: string; label?: string; description?: string }[];
}) {
  const colors = DIFFICULTY_COLORS[type];
  const label = type === 'basic' ? 'BSC' : type === 'advanced' ? 'ADV' : 'EXT';

  // 只显示评级标记
  const ratingPatterns = patterns?.filter(
    (p) => p.type === 'sahyou' || p.type === 'gyakusahyou' || p.type === 'kojinsa'
  ) || [];

  return (
    <div className={`relative h-16 rounded-lg ${colors.bgSolid} ${colors.border} border flex flex-col items-center justify-center`}>
      <span className={`text-[10px] font-bold uppercase ${colors.textOnBg}`}>
        {label}
      </span>
      <span className={`text-lg font-bold ${colors.textOnBg} leading-tight`}>
        {level}
      </span>
      {ratingPatterns.length > 0 && (
        <div className="absolute bottom-1 right-1 flex gap-0.5">
          {ratingPatterns.map((p, idx) => (
            <span
              key={idx}
              className={`text-[9px] px-1 rounded font-bold bg-white ${
                p.type === 'sahyou'
                  ? 'text-red-600'
                  : p.type === 'gyakusahyou'
                  ? 'text-blue-600'
                  : 'text-purple-600'
              }`}
              title={p.label}
            >
              {p.type === 'sahyou' ? '诈' : p.type === 'gyakusahyou' ? '逆' : '差'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for tags
function Tag({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white ${colorClass}`}>
      {label}
    </span>
  );
}
