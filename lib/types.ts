export interface Song {
  id: string;
  title: string;
  titleRomaji?: string;
  titleChinese?: string;
  artist: string;
  genre: string;
  bpm: number;
  bpmRange?: string;
  difficulties: {
    basic: Difficulty;
    advanced: Difficulty;
    extreme: Difficulty;
  };
  version: string;
  isLicense: boolean;
  isNew?: boolean;
  releaseDate?: string;
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
