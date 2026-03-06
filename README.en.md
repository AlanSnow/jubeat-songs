# jubeat-songs

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[中文](README.md) | [日本語](README.ja.md)

## 📖 Project Overview

jubeat-songs is a song database website for jubeat (BEMANI rhythm game series). It provides song search, filtering, and viewing capabilities, including difficulty levels, BPM, and version history.

## ⚠️ Disclaimer

**This project is for learning purposes only. Commercial use is strictly prohibited.**

## 📊 Data Source

All song data is sourced from [jubeat @wiki](https://w.atwiki.jp/jubeat/) for personal learning reference only.

## ✨ Features

- 🔍 **Fuzzy Search** - Search by song title and artist
- 🎚️ **Multi-dimensional Filtering** - Filter by version, difficulty, level, note count, BPM, genre, etc.
- 🌙 **Dark Mode** - Light/dark theme toggle support
- 📱 **Responsive Design** - Desktop and mobile compatible

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Search**: Fuse.js
- **Build**: Static Export

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build
pnpm build

# Production mode
pnpm start
```

## 📁 Project Structure

```
app/           # Next.js pages and components
data/          # Song data
lib/           # Type definitions
scripts/       # Data crawling scripts
atwiki/        # atwiki HTML cache
```

## 📜 Version History

jubeat versions (chronological order):
ripples → knit → copious → saucer → saucer fulfill → prop → Qubell → clan → festo → Ave. → Beyond the Ave.

## 🗺️ Roadmap

- [ ] Enhanced filtering system
  - [ ] Song category filter
  - [ ] Pickup marker
  - [ ] Long press identification
  - [ ] Text press identification
  - [ ] False difficulty / Inverse false difficulty markers
- [ ] Add song jacket images

## 🤝 Contributing

Contributions are welcome! You can participate by:

- Submitting Issues to report bugs or suggest new features
- Submitting Pull Requests to contribute code
- Improving documentation or translations

## ⭐ Star History

If this project helps you, please consider giving it a Star ⭐

---

<p align="center">Made with 💜 for jubeat players</p>
