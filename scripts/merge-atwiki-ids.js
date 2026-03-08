/**
 * 合并 atwiki Html ID 到 songs JSON
 *
 * 从 atwiki 曲列表中提取 atwikiHtmlId，并写入到现有的 songs JSON 中
 * 注意：歌曲名后带有 [2]、[3] 等标记的是独立歌曲
 *
 * 数据字段说明：
 * - 现有数据中，title 字段实际存储的是分类（如"オリジナル"），artist 字段存储的是歌曲名
 * - atwiki 中，title 是歌曲名，artist 是艺术家
 * - 匹配时使用：现有数据的 artist 字段 vs atwiki 的 title 字段
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // 输入：现有歌曲数据（正确的数据源）
  songsFile: './data/songs.json',
  // atwiki HTML 文件目录
  atwikiDir: './sources/atwiki',
  // 输出文件
  outputFile: './data/songs.json',
  // TypeScript 输出文件
  tsOutputFile: './data/songs.ts',
  // 匹配曲列表文件的模式
  listFilePattern: /^曲リスト.*\.html$/,
};

// 清理文本
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/◆/g, '')  // 移除隐藏曲标记
    .trim();
}

// 从 href 提取 page ID
function extractPageId(href) {
  if (!href) return null;
  const match = href.match(/pages\/(\d+)\.html/);
  return match ? parseInt(match[1], 10) : null;
}

// 解析 HTML 实体
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity);
}

// 标准化歌曲名（用于匹配）
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\s\(\)（）\[\]『』「」]/g, '')  // 移除括号和空格
    .replace(/[!！?？]/g, '')  // 移除标点
    .trim();
}

// 从 atwiki HTML 文件中提取歌曲映射（title -> atwikiHtmlId）
function extractAtwikiMapping(filePath) {
  console.log(`[解析] ${path.basename(filePath)}`);

  const html = fs.readFileSync(filePath, 'utf-8');
  const songs = [];

  // 匹配整个表格行
  const rowRegex = /<tr[^>]*class="atwiki_tr[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;

  // 匹配单元格（包括带注释的格式 <!--X-Y--><td...>）
  const cellRegex = /<!--\d+-\d+--><td[^>]*>([\s\S]*?)<\/td>/g;

  // 匹配链接 <a href="..." title="...">text</a>
  const linkRegex = /<a\s+href="([^"]+)"\s+title="[^"]*">([^<]*)<\/a>/;

  // 匹配 [2]、[3] 等后缀（在 </a> 后面）
  const suffixRegex = /<\/a>\s*(\[\d+\])/;

  let rowMatch;
  let rowCount = 0;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // 提取所有单元格
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1]);
    }

    // 至少需要曲名和艺术家
    if (cells.length < 2) continue;

    // 第一个单元格是曲名，包含链接和可能的 [2] 后缀
    const titleCell = cells[0];
    const linkMatch = titleCell.match(linkRegex);

    if (!linkMatch) continue;

    const href = linkMatch[1];
    const pageId = extractPageId(href);

    if (!pageId) continue;

    // 提取基础曲名
    let title = cleanText(decodeHtmlEntities(linkMatch[2]));

    // 检查是否有 [2]、[3] 等后缀（在 <a> 标签外面）
    const suffixMatch = titleCell.match(suffixRegex);
    if (suffixMatch) {
      title = `${title} ${suffixMatch[1]}`;
    }

    // 提取艺术家（第二个单元格）- 移除 HTML 标签
    let artist = cleanText(decodeHtmlEntities(cells[1].replace(/<[^>]+>/g, '')));

    if (title && artist) {
      songs.push({
        title,
        artist,
        atwikiHtmlId: pageId,
        atwikiUrl: href.startsWith('//') ? `https:${href}` : href,
        // 用于匹配的键
        matchKey: normalizeTitle(title),
      });
      rowCount++;
    }
  }

  console.log(`  提取: ${rowCount} 首`);
  return songs;
}

// 主函数
function main() {
  try {
    // 1. 读取现有歌曲数据
    console.log(`\n[读取] ${CONFIG.songsFile}`);
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'));
    console.log(`  现有歌曲: ${songsData.length} 首`);

    // 2. 检查 atwiki 目录
    if (!fs.existsSync(CONFIG.atwikiDir)) {
      console.error(`❌ 目录不存在: ${CONFIG.atwikiDir}`);
      process.exit(1);
    }

    // 3. 获取所有曲列表文件
    const files = fs.readdirSync(CONFIG.atwikiDir)
      .filter(name => CONFIG.listFilePattern.test(name))
      .map(name => path.join(CONFIG.atwikiDir, name));

    console.log(`\n发现 ${files.length} 个曲列表文件`);

    // 4. 解析所有 atwiki 文件
    let allAtwikiSongs = [];
    for (const file of files) {
      const songs = extractAtwikiMapping(file);
      allAtwikiSongs.push(...songs);
    }

    console.log(`\n=== atwiki 统计 ===`);
    console.log(`总提取: ${allAtwikiSongs.length} 首`);

    // 5. 去重（按 title + artist）
    const atwikiMap = new Map();
    const duplicates = [];

    allAtwikiSongs.forEach(song => {
      const key = `${song.title}|${song.artist}`;
      if (atwikiMap.has(key)) {
        const existing = atwikiMap.get(key);
        // 如果 ID 不同，记录冲突
        if (existing.atwikiHtmlId !== song.atwikiHtmlId) {
          duplicates.push({
            title: song.title,
            artist: song.artist,
            existingId: existing.atwikiHtmlId,
            duplicateId: song.atwikiHtmlId,
          });
        }
      } else {
        atwikiMap.set(key, song);
      }
    });

    console.log(`去重后: ${atwikiMap.size} 首`);

    if (duplicates.length > 0) {
      console.log(`\n⚠️ 发现 ${duplicates.length} 个 ID 冲突:`);
      duplicates.slice(0, 5).forEach(d => {
        console.log(`  - ${d.title}: ${d.existingId} vs ${d.duplicateId}`);
      });
    }

    // 6. 匹配并合并数据
    console.log(`\n=== 匹配歌曲 ===`);
    let matchedCount = 0;
    let unmatchedSongs = [];

    // 创建 atwiki 反向映射用于快速查找（按标准化标题）
    const atwikiByTitle = new Map();
    atwikiMap.forEach((song, key) => {
      // 使用标准化标题作为键
      if (!atwikiByTitle.has(song.matchKey)) {
        atwikiByTitle.set(song.matchKey, []);
      }
      atwikiByTitle.get(song.matchKey).push(song);
    });

    // 遍历现有歌曲数据，添加 atwikiHtmlId
    // songs.json 中字段是正确的：title=歌曲名，artist=艺术家
    const updatedSongs = songsData.map(song => {
      // 使用现有数据的 title 字段（歌曲名）来匹配
      const matchKey = normalizeTitle(song.title);
      const candidates = atwikiByTitle.get(matchKey);

      if (candidates && candidates.length > 0) {
        // 如果有多个候选（如 [2] 版本），选择最匹配的
        // 简化：选择第一个
        const atwikiSong = candidates[0];
        matchedCount++;
        return {
          ...song,
          atwikiHtmlId: atwikiSong.atwikiHtmlId,
        };
      } else {
        // 未匹配到，记录
        unmatchedSongs.push({
          title: song.title,
          artist: song.artist,
          matchKey,
        });
        return song;
      }
    });

    console.log(`匹配成功: ${matchedCount}/${songsData.length} 首`);
    console.log(`未匹配: ${unmatchedSongs.length} 首`);

    // 7. 显示一些未匹配的歌曲示例
    if (unmatchedSongs.length > 0) {
      console.log(`\n未匹配歌曲示例（前15首）:`);
      unmatchedSongs.slice(0, 15).forEach(s => {
        console.log(`  - [${s.title}] ${s.artist} (key: ${s.matchKey})`);
      });
    }

    // 8. 显示匹配成功的示例
    const matchedWithId = updatedSongs.filter(s => s.atwikiHtmlId);
    console.log(`\n✅ 匹配成功示例（前15首）:`);
    matchedWithId.slice(0, 15).forEach(s => {
      console.log(`  - [${s.title}] ${s.artist} -> ID: ${s.atwikiHtmlId}`);
    });

    // 9. 显示带有 [2] 标记的匹配歌曲
    const withSuffix = matchedWithId.filter(s => s.artist.includes('[2]') || s.artist.includes('[3]'));
    console.log(`\n📝 带 [2]/[3] 标记的歌曲: ${withSuffix.length} 首`);
    withSuffix.slice(0, 10).forEach(s => {
      console.log(`  - ${s.artist} -> ID: ${s.atwikiHtmlId}`);
    });

    // 10. 保存 JSON 结果
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(updatedSongs, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.outputFile}`);

    // 11. 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(updatedSongs, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

    // 12. 统计 atwikiHtmlId 范围
    const ids = matchedWithId.map(s => s.atwikiHtmlId).filter(id => id);
    if (ids.length > 0) {
      console.log(`\n📊 atwikiHtmlId 范围: ${Math.min(...ids)} ~ ${Math.max(...ids)}`);
    }

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
