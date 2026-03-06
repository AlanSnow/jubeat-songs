# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js web application for querying jubeat (BEMANI rhythm game) songs. It provides a Chinese-language interface for searching, filtering, and viewing song data including difficulty levels, BPM, and version history.

## Common Commands

```bash
# Development
pnpm dev              # Start Next.js dev server on http://localhost:3000

# Build & Deploy
pnpm build            # Build static export to `dist/` directory
pnpm start            # Start production server (after build)

# Linting
pnpm lint             # Run ESLint

# Data Crawling (Node.js scripts)
node scripts/crawler.js     # Basic crawler - fetches from BEMANI Wiki
node scripts/crawler-v2.js  # Enhanced crawler with version/date detection
```

**Note:** The project uses `pnpm` as the package manager.

## Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Search:** Fuse.js for fuzzy search
- **Build Output:** Static export (`dist/`)

### Data Flow
1. **Source Data:** BEMANI Wiki (Japanese) - scraped via crawlers in `scripts/`
2. **Cached HTML:** Stored in `cache/` and `atwiki/` for development
3. **Processed Data:** `data/songs.ts` exports a typed `Song[]` array
4. **UI:** React components in `app/` consume the data with filtering/search

### Key Files & Directories

```
app/
  page.tsx           # Main UI with search, filters, song grid
  layout.tsx         # Root layout with metadata
  globals.css        # Tailwind imports + base styles

data/
  songs.ts           # Main song data (~730KB, exported as const)
  songs-complete.json # Alternative JSON format
  songs-full.json    # Raw crawler output

lib/
  types.ts           # TypeScript interfaces (Song, Difficulty, Genre)

scripts/
  crawler.js         # Basic BEMANI Wiki crawler
  crawler-v2.js      # Enhanced crawler with release date detection
  test-download.js   # HTML download utility

cache/               # Crawler HTML cache
atwiki/              # Manually downloaded atwiki HTML backups
```

### Type System (`lib/types.ts`)

```typescript
Song {
  id: string
  title: string
  artist: string
  genre: Genre  // ポップス | アニメ | 東方アレンジ | etc.
  bpm: number
  difficulties: {
    basic: { level: number, notes: number }
    advanced: { level: number, notes: number }
    extreme: { level: number, notes: number, rating?: '诈称'|'逆诈称'|'个人差' }
  }
  firstAppearance: string      // e.g., "festo"
  versionHistory: string[]     // All versions the song appeared in
  deletedIn?: string           // Version where song was removed
  isLicense: boolean           // true = licensed song
}
```

### Crawler Details

The crawlers scrape HTML from BEMANI Wiki (EUC-JP encoding):
- **URLs:** New songs, old songs, BTA (Beyond the Ave.) songs
- **Parsing:** Uses cheerio to extract tables with difficulty data
- **Features:** Detects release dates, versions, categorizes by genre
- **Caching:** `devMode: true` reads from cache instead of re-downloading

Key crawler config in `scripts/crawler-v2.js`:
```javascript
CONFIG = {
  devMode: true,           // Use cached HTML
  cacheDir: './cache',
  outputFile: './data/songs-full.json',
  pages: {
    newSongs: '...',       // jubeat Ave. 新曲リスト
    oldSongs: '...',       // jubeat Ave. 旧曲リスト
    btaSongs: '...',       // Beyond the Ave. 新曲リスト
  }
}
```

### UI Features (`app/page.tsx`)

- **Search:** Fuse.js fuzzy search on title and artist
- **Filters:** Genre, version (with version history support), EXTREME level
- **Display:** Card grid showing difficulties with color-coded level badges
- **i18n:** Chinese UI labels mapping Japanese genre names

### Build Configuration

`next.config.js` - Static export for deployment:
```javascript
{
  output: 'export',
  distDir: 'dist',
  images: { unoptimized: true }
}
```

Path aliases in `tsconfig.json`:
```json
"@/*": ["./*"]   // Maps @/ to project root
```

## Version History

jubeat versions (chronological):
1. ripples → knit → copious → saucer → saucer fulfill
2. prop → Qubell → clan → festo
3. Ave. → Beyond the Ave. (current)

The `versionHistory` field tracks all versions a song has appeared in, allowing users to filter by "songs that existed in festo" even if they appeared earlier.
