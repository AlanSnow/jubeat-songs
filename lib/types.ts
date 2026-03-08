// 谱面图案/标记类型
export interface ChartPattern {
  type: 'sahyou' | 'gyakusahyou' | 'kojinsa' | 'text' | 'shape';
  label?: string;      // 中文标签 (诈称/逆诈称/个人差)
  description?: string; // 图案描述 (如 "ハート", "回る" 等)
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  bpmRange: string;             // BPM 范围，如 "160" 或 "135-175"
  avatar?: string;              // 歌曲封面图 URL
  // 按版本存储的难度历史（必需）
  versionDifficulties: Record<string, VersionDifficulty>;
  // 谱面标记（按难度分类）
  chartPatterns?: {
    basic?: ChartPattern[];
    advanced?: ChartPattern[];
    extreme?: ChartPattern[];
  };
  firstAppearance: string;      // 首次登场版本
  versionHistory: string[];     // 存在过的所有版本
  releaseDate?: string;
  deletedDate?: string;
  deletedIn?: string;           // 被删除的版本
  isNew?: boolean;
  atwikiHtmlId?: number;        // atwiki 页面 ID，用于匹配 pages/x.html
  appearanceVersion?: string;   // atwiki 中的 Version 字段（首次登场版本详细描述）
  time?: string;                // 歌曲时长
}

export interface Difficulty {
  level: number;
  notes: number;
  rating?: '诈称' | '逆诈称' | '个人差' | null;
}

// 特定版本的难度数据
export interface VersionDifficulty {
  version: string;
  basic: Difficulty;
  advanced: Difficulty;
  extreme: Difficulty;
}

export type DifficultyType = 'basic' | 'advanced' | 'extreme';

export type Genre =
  | 'ポップス'
  | 'アニメ'
  | '東方アレンジ'
  | 'バラエティ'
  | 'ナムコオリジナル'
  | 'コナミオリジナル';

export const GENRE_COLORS: Record<string, string> = {
  // 标准分类
  'ポップス': 'bg-pink-500',
  'アニメ': 'bg-orange-500',
  '東方アレンジ': 'bg-purple-500',
  'バラエティ': 'bg-green-500',
  'ナムコオリジナル': 'bg-blue-500',
  'コナミオリジナル': 'bg-red-500',
  // atwiki 具体分类
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
  'ゲーム': 'bg-violet-500',
  'ソーシャル': 'bg-pink-400',
  'アニメポップス': 'bg-orange-400',
  'ライセンス': 'bg-gray-500',
  'ゲームオリジナル': 'bg-violet-600',
};

export const GENRE_LABELS: Record<string, string> = {
  // 特殊选项
  '全部': '全部',
  '未分类': '未分类',
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
  'ゲーム': '游戏音乐',
  'ソーシャル': '社交',
  'アニメポップス': '动漫流行',
  'ライセンス': '授权曲',
  'ゲームオリジナル': '游戏原创',
};

// 版本列表（时间顺序）
export const VERSIONS = [
  'ripples',
  'knit',
  'copious',
  'saucer',
  'saucer fulfill',
  'prop',
  'Qubell',
  'clan',
  'festo',
  'Ave.',
  'Beyond the Ave.',
  '音乐魔方'
] as const;

export const VERSION_LABELS: Record<string, string> = {
  'ripples': 'ripples',
  'knit': 'knit',
  'copious': 'copious',
  'saucer': 'saucer',
  'saucer fulfill': 'saucer fulfill',
  'prop': 'prop',
  'Qubell': 'Qubell',
  'clan': 'clan',
  'festo': 'festo',
  'Ave.': 'Ave.',
  'Beyond the Ave.': 'Beyond the Ave.',
  '音乐魔方': '音乐魔方',
};

// 版本优先级（时间倒序，最新的在前）
const VERSION_PRIORITY = [
  '音乐魔方',
  'Beyond the Ave.',
  'Ave.',
  'festo',
  'clan',
  'Qubell',
  'prop',
  'saucer fulfill',
  'saucer',
  'copious',
  'knit',
  'ripples',
  'jubeat'
];

// 获取歌曲的最新版本
export function getLatestVersion(versionHistory: string[]): string | null {
  if (!versionHistory || versionHistory.length === 0) return null;

  for (const version of VERSION_PRIORITY) {
    if (versionHistory.includes(version)) {
      return version;
    }
  }
  return versionHistory[versionHistory.length - 1];
}

// 获取歌曲在指定版本的难度
export function getDifficultyForVersion(
  song: Song,
  version: string
): { basic: Difficulty; advanced: Difficulty; extreme: Difficulty } | null {
  // 如果指定了 ALL，返回最新版本的难度
  if (version === 'all') {
    const latestVersion = getLatestVersion(song.versionHistory);
    if (latestVersion && song.versionDifficulties?.[latestVersion]) {
      return song.versionDifficulties[latestVersion];
    }
    // 如果没有找到最新版本，返回第一个可用的版本难度
    const availableVersions = Object.keys(song.versionDifficulties || {});
    if (availableVersions.length > 0) {
      return song.versionDifficulties[availableVersions[0]];
    }
    return null;
  }

  // 检查该歌曲是否存在于该版本
  if (!song.versionHistory?.includes(version)) {
    return null;
  }

  // 返回该版本的难度数据
  if (song.versionDifficulties?.[version]) {
    return song.versionDifficulties[version];
  }

  // 如果该版本没有难度数据，返回 null（表示数据缺失）
  return null;
}

// 获取歌曲在某个版本之后的最新难度
export function getLatestDifficultyBeforeVersion(
  song: Song,
  targetVersion: string
): { basic: Difficulty; advanced: Difficulty; extreme: Difficulty } | null {
  const targetIndex = VERSIONS.indexOf(targetVersion as any);
  if (targetIndex === -1) {
    // 返回最新可用版本的难度
    const latestVersion = getLatestVersion(song.versionHistory);
    if (latestVersion && song.versionDifficulties?.[latestVersion]) {
      return song.versionDifficulties[latestVersion];
    }
    const availableVersions = Object.keys(song.versionDifficulties || {});
    if (availableVersions.length > 0) {
      return song.versionDifficulties[availableVersions[0]];
    }
    return null;
  }

  // 从目标版本往前找，找到第一个有难度数据的版本
  for (let i = targetIndex; i >= 0; i--) {
    const version = VERSIONS[i];
    if (song.versionDifficulties?.[version]) {
      return song.versionDifficulties[version];
    }
  }

  // 如果没有找到特定版本数据，返回第一个可用版本的难度
  const availableVersions = Object.keys(song.versionDifficulties || {});
  if (availableVersions.length > 0) {
    return song.versionDifficulties[availableVersions[0]];
  }
  return null;
}
