# jubeat-songs

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[日本語](README.ja.md) | [English](README.en.md)

## 📖 项目简介

jubeat-songs 是一个 jubeat（BEMANI 系列音游）曲目查询网站，提供曲目搜索、筛选和查看功能，包括难度等级、BPM、版本历史等信息。

## ⚠️ 免责声明

**本项目仅供学习交流使用，严禁用于任何商业用途。**

## 📊 数据来源

所有曲目数据均来源于 [jubeat @wiki](https://w.atwiki.jp/jubeat/)，仅供个人学习参考。

## ✨ 功能特性

- 🔍 **模糊搜索** - 支持按曲名、艺术家搜索
- 🎚️ **多维度筛选** - 按版本、难度、等级、音符数、BPM、曲风等筛选
- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **响应式设计** - 适配桌面端和移动端

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 3
- **搜索**: Fuse.js
- **构建**: 静态导出

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 生产模式
pnpm start
```

## 📁 项目结构

```
app/           # Next.js 页面和组件
data/          # 曲目数据
lib/           # 类型定义
scripts/       # 数据爬取脚本
atwiki/        # atwiki HTML 缓存
```

## 📜 版本历史

jubeat 版本（按时间顺序）：
ripples → knit → copious → saucer → saucer fulfill → prop → Qubell → clan → festo → Ave. → Beyond the Ave.

## �️ 开发计划

- [ ] 完善筛选机制
  - [ ] 歌曲分类筛选
  - [ ] Pickup 标记
  - [ ] 长押标识
  - [ ] 文字押标识
  - [ ] 诈欺/逆诈欺标记
- [ ] 补充歌曲封面

## 🤝 参与贡献

欢迎参与项目贡献！你可以通过以下方式参与：

- 提交 Issue 报告 Bug 或提出新功能建议
- 提交 Pull Request 贡献代码
- 完善文档或翻译

## ⭐ Star History

如果这个项目对你有帮助，欢迎给个 Star ⭐

---

<p align="center">Made with 💜 for jubeat players</p>
