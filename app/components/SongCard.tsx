'use client';

import { Song } from '@/lib/types';
import { ImageOff } from 'lucide-react';

interface SongCardProps {
  song: Song;
  isDarkMode: boolean;
}

// jubeat difficulty colors
const DIFFICULTY_COLORS = {
  basic: {
    bg: 'bg-[#7CB342]',
    bgLight: 'bg-[#7CB342]/10',
    border: 'border-[#7CB342]/30',
    text: 'text-[#558B2F]',
  },
  advanced: {
    bg: 'bg-[#FBC02D]',
    bgLight: 'bg-[#FBC02D]/10',
    border: 'border-[#FBC02D]/30',
    text: 'text-[#F57F17]',
  },
  extreme: {
    bg: 'bg-[#E53935]',
    bgLight: 'bg-[#E53935]/10',
    border: 'border-[#E53935]/30',
    text: 'text-[#C62828]',
  },
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

export default function SongCard({ song, isDarkMode }: SongCardProps) {
  const hasAvatar = song.avatar && song.avatar.length > 0;

  return (
    <div
      className={`group rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isDarkMode
          ? 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
          : 'bg-white border border-gray-200 hover:border-gray-300 shadow-md'
      }`}
    >
      {/* Cover Image Section */}
      <div className="relative aspect-square overflow-hidden max-h-40">
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
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              No Cover
            </span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Genre Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg ${
              GENRE_COLORS[song.genre] || 'bg-gray-500'
            }`}
          >
            {GENRE_LABELS[song.genre] || song.genre}
          </span>
        </div>

        {/* License Badge */}
        {song.isLicense && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/80 text-white shadow-lg backdrop-blur-sm">
              License
            </span>
          </div>
        )}

        {/* Title and Artist overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg leading-tight mb-1 line-clamp-2 drop-shadow-lg">
            {song.title}
          </h3>
          <p className="text-white/80 text-sm truncate drop-shadow-md">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2 text-xs border-b ${
          isDarkMode
            ? 'bg-gray-800/80 border-gray-700 text-gray-400'
            : 'bg-gray-50 border-gray-100 text-gray-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <span>BPM {song.bpm}{song.bpmRange ? ` (${song.bpmRange})` : ''}</span>
          <span>•</span>
          <span>{song.firstAppearance}</span>
        </div>
        {song.deletedIn && (
          <span className="text-red-400">Deleted in {song.deletedIn}</span>
        )}
      </div>

      {/* Difficulty Section */}
      <div className="grid grid-cols-3">
        {/* BASIC */}
        <div
          className={`relative p-4 ${DIFFICULTY_COLORS.basic.bgLight} ${DIFFICULTY_COLORS.basic.border} border-r`}
        >
          <div className="text-center">
            <div
              className={`text-xs font-bold mb-2 uppercase tracking-wider ${DIFFICULTY_COLORS.basic.text}`}
            >
              BASIC
            </div>
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shadow-lg ${DIFFICULTY_COLORS.basic.bg}`}
            >
              {song.difficulties.basic.level}
            </div>
            <div
              className={`mt-2 text-sm font-medium ${DIFFICULTY_COLORS.basic.text}`}
            >
              {song.difficulties.basic.notes} Notes
            </div>
          </div>
        </div>

        {/* ADVANCED */}
        <div
          className={`relative p-4 ${DIFFICULTY_COLORS.advanced.bgLight} ${DIFFICULTY_COLORS.advanced.border} border-r`}
        >
          <div className="text-center">
            <div
              className={`text-xs font-bold mb-2 uppercase tracking-wider ${DIFFICULTY_COLORS.advanced.text}`}
            >
              ADVANCED
            </div>
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shadow-lg ${DIFFICULTY_COLORS.advanced.bg}`}
            >
              {song.difficulties.advanced.level}
            </div>
            <div
              className={`mt-2 text-sm font-medium ${DIFFICULTY_COLORS.advanced.text}`}
            >
              {song.difficulties.advanced.notes} Notes
            </div>
          </div>
        </div>

        {/* EXTREME */}
        <div
          className={`relative p-4 ${DIFFICULTY_COLORS.extreme.bgLight} ${DIFFICULTY_COLORS.extreme.border}`}
        >
          <div className="text-center">
            <div
              className={`text-xs font-bold mb-2 uppercase tracking-wider ${DIFFICULTY_COLORS.extreme.text}`}
            >
              EXTREME
            </div>
            <div
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shadow-lg ${DIFFICULTY_COLORS.extreme.bg}`}
            >
              {song.difficulties.extreme.level}
            </div>
            <div
              className={`mt-2 text-sm font-medium ${DIFFICULTY_COLORS.extreme.text}`}
            >
              {song.difficulties.extreme.notes} Notes
            </div>
            {song.difficulties.extreme.rating && (
              <div className="mt-1 text-xs text-red-600 font-semibold">
                ⚠ {song.difficulties.extreme.rating}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
