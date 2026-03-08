'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Github, Globe, Music } from 'lucide-react';

interface NavbarProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  isDarkMode: boolean;
  onDarkModeChange: (isDark: boolean) => void;
}

const PLAYABLE_VERSIONS = [
  { value: 'all', label: 'All Versions', labelZh: '全部版本' },
  { value: 'jubeat', label: 'jubeat', labelZh: 'jubeat (初代)' },
  { value: 'ripples', label: 'ripples', labelZh: 'ripples' },
  { value: 'knit', label: 'knit', labelZh: 'knit' },
  { value: 'copious', label: 'copious', labelZh: 'copious' },
  { value: 'saucer', label: 'saucer', labelZh: 'saucer' },
  { value: 'saucer fulfill', label: 'saucer fulfill', labelZh: 'saucer fulfill' },
  { value: 'prop', label: 'prop', labelZh: 'prop' },
  { value: 'Qubell', label: 'Qubell', labelZh: 'Qubell' },
  { value: 'clan', label: 'clan', labelZh: 'clan' },
  { value: 'festo', label: 'festo', labelZh: 'festo' },
  { value: 'Ave.', label: 'Ave.', labelZh: 'Ave.' },
  { value: 'Beyond the Ave.', label: 'Beyond the Ave.', labelZh: 'Beyond the Ave.' },
];

const LANGUAGES = [
  { code: 'zh', label: '简体中文' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

export default function Navbar({
  selectedVersion,
  onVersionChange,
  isDarkMode,
  onDarkModeChange,
}: NavbarProps) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('zh');

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedVersionLabel = PLAYABLE_VERSIONS.find(
    (v) => v.value === selectedVersion
  )?.labelZh || selectedVersion;

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Music className="w-7 h-7 text-pink-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Jubeat Songs
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gray-900/80 border-gray-700 text-white'
        : 'bg-white/80 border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Music className="w-7 h-7 text-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Jubeat Songs
            </span>
          </div>

          {/* Version Selector - Shows songs playable in this version */}
          <div className="hidden md:flex items-center gap-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>可游玩版本:</span>
            <div className="relative">
              <select
                value={selectedVersion}
                onChange={(e) => onVersionChange(e.target.value)}
                className={`appearance-none pl-4 pr-10 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {PLAYABLE_VERSIONS.map((version) => (
                  <option key={version.value} value={version.value}>
                    {version.labelZh}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => onDarkModeChange(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-yellow-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Change Language"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">{currentLang.toUpperCase()}</span>
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg border z-20 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700'
                      : 'bg-white border-gray-200'
                  }`}>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLang(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
                          currentLang === lang.code
                            ? isDarkMode
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* GitHub Link */}
            <a
              href="https://github.com/AlanSnow/jubeat-songs"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Mobile Version Selector */}
        <div className="md:hidden pb-3">
          <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>当前版本</label>
          <select
            value={selectedVersion}
            onChange={(e) => onVersionChange(e.target.value)}
            className={`w-full appearance-none px-4 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            {PLAYABLE_VERSIONS.map((version) => (
              <option key={version.value} value={version.value}>
                {version.labelZh}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
