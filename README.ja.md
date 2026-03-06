# jubeat-songs

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[中文](README.md) | [English](README.en.md)

## 📖 プロジェクト概要

jubeat-songs は、jubeat（BEMANIシリーズのリズムゲーム）の楽曲検索サイトです。楽曲の検索、フィルタリング、閲覧機能を提供し、難易度、BPM、バージョン履歴などの情報を確認できます。

## ⚠️ 免責事項

**本プロジェクトは学習目的のみに使用してください。商業利用は厳禁です。**

## 📊 データソース

すべての楽曲データは [jubeat @wiki](https://w.atwiki.jp/jubeat/) より取得しており、個人学習参考用です。

## ✨ 機能

- 🔍 **あいまい検索** - 曲名、アーティスト名で検索
- 🎚️ **多角的フィルタリング** - バージョン、難易度、レベル、ノート数、BPM、ジャンルなどでフィルタリング
- 🌙 **ダークモード** - ライト/ダークテーマ切り替え対応
- 📱 **レスポンシブデザイン** - デスクトップ・モバイル対応

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS 3
- **検索**: Fuse.js
- **ビルド**: 静的エクスポート

## 🚀 クイックスタート

```bash
# 依存関係のインストール
pnpm install

# 開発モード
pnpm dev

# ビルド
pnpm build

# 本番モード
pnpm start
```

## 📁 プロジェクト構成

```
app/           # Next.js ページとコンポーネント
data/          # 楽曲データ
lib/           # 型定義
scripts/       # データ収集スクリプト
atwiki/        # atwiki HTML キャッシュ
```

## 📜 バージョン履歴

jubeat バージョン（時系列順）：
ripples → knit → copious → saucer → saucer fulfill → prop → Qubell → clan → festo → Ave. → Beyond the Ave.

## 🗺️ ロードマップ

- [ ] フィルタリング機能の強化
  - [ ] 楽曲カテゴリフィルタ
  - [ ] Pickup マーク
  - [ ] 長押し識別
  - [ ] 文字押し識別
  - [ ] 詐称/逆詐称マーク
- [ ] 楽曲ジャケット画像の追加

## 🤝 コントリビュート

プロジェクトへの貢献を歓迎します！以下の方法で参加できます：

- Issue を投稿してバグ報告や新機能の提案
- Pull Request を送信してコードを貢献
- ドキュメントや翻訳の改善

## ⭐ Star History

このプロジェクトが役に立ったら、Star ⭐ をお願いします

---

<p align="center">Made with 💜 for jubeat players</p>
