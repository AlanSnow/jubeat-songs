export interface Song {
  id: string;
  title: string;
  titleRomaji?: string;
  titleChinese?: string;
  artist: string;
  genre: string;
  bpm: number;
  bpmRange?: string;
  avatar?: string;              // 歌曲封面图 URL
  difficulties: {
    basic: Difficulty;
    advanced: Difficulty;
    extreme: Difficulty;
  };
  firstAppearance: string;      // 首次登场版本
  versionHistory: string[];     // 存在过的所有版本
  releaseDate?: string;
  deletedDate?: string;
  deletedIn?: string;           // 被删除的版本
  isLicense: boolean;
  isNew?: boolean;
}

export interface Difficulty {
  level: number;
  notes: number;
  rating?: '诈称' | '逆诈称' | '个人差' | null;
}

export type Genre = 
  | 'ポップス' 
  | 'アニメ' 
  | '東方アレンジ' 
  | 'バラエティ' 
  | 'ナムコオリジナル' 
  | 'コナミオリジナル';

export const GENRE_COLORS: Record<string, string> = {
  'ポップス': 'bg-pink-500',
  'アニメ': 'bg-orange-500',
  '東方アレンジ': 'bg-purple-500',
  'バラエティ': 'bg-green-500',
  'ナムコオリジナル': 'bg-blue-500',
  'コナミオリジナル': 'bg-red-500',
};

export const GENRE_LABELS: Record<string, string> = {
  'ポップス': '流行',
  'アニメ': '动漫',
  '東方アレンジ': '东方',
  'バラエティ': '综艺',
  'ナムコオリジナル': 'NAMCO原创',
  'コナミオリジナル': 'KONAMI原创',
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
  'Beyond the Ave.'
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
};
