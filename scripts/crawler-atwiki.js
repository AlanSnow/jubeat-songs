/**
 * atwiki jubeat 曲目爬虫
 * 提取：歌曲详情页链接中的 HTML ID (atwikiHtmlId)
 *
 * 用法:
 *   node scripts/crawler-atwiki.js
 *
 * 输入: atwiki/曲リスト(*).html 文件
 * 输出: data/songs-atwiki-mapping.json
 *
 * 提取逻辑:
 *   - 从曲名单元格中的 <a href="//w.atwiki.jp/jubeat/pages/103.html"> 提取 ID: 103
 *   - 保存为 atwikiHtmlId 字段，用于后续匹配 pages/x.html 中的详情
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // atwiki HTML 文件目录
  atwikiDir: './sources/atwiki',
  // 输出文件
  outputFile: './data/songs-atwiki-mapping.json',
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
// 支持格式: //w.atwiki.jp/jubeat/pages/103.html 或 https://w.atwiki.jp/jubeat/pages/103.html
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

// 解析单个 HTML 文件
function parseAtwikiListFile(filePath) {
  console.log(`\n[解析] ${path.basename(filePath)}`);

  const html = fs.readFileSync(filePath, 'utf-8');
  const songs = [];

  // atwiki 表格行格式：
  // <tr class="...">   <!--X-Y--><td style=""><a href="//w.atwiki.jp/jubeat/pages/2264.html" title="...">曲名</a></td>   <!--X-Y--><td style="">アーティスト</td>...

  // 匹配整个表格行
  const rowRegex = /<tr[^>]*class="atwiki_tr[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;

  // 匹配单元格（包括带注释的格式 <!--X-Y--><td...>）
  const cellRegex = /<!--\d+-\d+--><td[^>]*>([\s\S]*?)<\/td>/g;

  // 匹配链接 <a href="..." title="...">text</a>
  const linkRegex = /<a\s+href="([^"]+)"\s+title="[^"]*">([^<]*)<\/a>/;

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

    // 第一个单元格应该是曲名，应该包含链接
    const titleCell = cells[0];
    const linkMatch = titleCell.match(linkRegex);

    if (!linkMatch) continue;

    const href = linkMatch[1];
    const pageId = extractPageId(href);

    if (!pageId) continue;

    // 提取曲名
    let title = cleanText(decodeHtmlEntities(linkMatch[2]));

    // 提取艺术家（第二个单元格）
    let artist = cleanText(decodeHtmlEntities(cells[1].replace(/<[^>]+>/g, '')));

    if (title && artist) {
      songs.push({
        title,
        artist,
        atwikiHtmlId: pageId,
        atwikiUrl: href.startsWith('//') ? `https:${href}` : href,
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
    // 检查 atwiki 目录是否存在
    if (!fs.existsSync(CONFIG.atwikiDir)) {
      console.error(`❌ 目录不存在: ${CONFIG.atwikiDir}`);
      console.log('请确保 atwiki HTML 文件放在 ./atwiki/ 目录下');
      process.exit(1);
    }

    // 获取所有曲列表文件
    const files = fs.readdirSync(CONFIG.atwikiDir)
      .filter(name => CONFIG.listFilePattern.test(name))
      .map(name => path.join(CONFIG.atwikiDir, name));

    if (files.length === 0) {
      console.error(`❌ 未找到曲列表文件 (曲リスト*.html)`);
      process.exit(1);
    }

    console.log(`发现 ${files.length} 个曲列表文件:`);
    files.forEach(f => console.log(`  - ${path.basename(f)}`));

    // 解析所有文件
    let allSongs = [];
    for (const file of files) {
      const songs = parseAtwikiListFile(file);
      allSongs.push(...songs);
    }

    // 去重（按 title + artist）
    const seen = new Map();
    const duplicates = [];

    allSongs = allSongs.filter(song => {
      const key = `${song.title}-${song.artist}`;
      if (seen.has(key)) {
        // 记录重复项
        const existing = seen.get(key);
        duplicates.push({
          title: song.title,
          artist: song.artist,
          existingId: existing.atwikiHtmlId,
          duplicateId: song.atwikiHtmlId,
        });
        return false;
      }
      seen.set(key, song);
      return true;
    });

    console.log(`\n=== 统计 ===`);
    console.log(`总提取: ${allSongs.length} 首（去重后）`);

    if (duplicates.length > 0) {
      console.log(`\n⚠️ 发现 ${duplicates.length} 个重复项（同一歌曲在不同版本列表中出现）:`);
      duplicates.slice(0, 5).forEach(d => {
        console.log(`  - ${d.title} (ID: ${d.existingId} vs ${d.duplicateId})`);
      });
      if (duplicates.length > 5) {
        console.log(`  ... 还有 ${duplicates.length - 5} 个`);
      }
    }

    // 按 atwikiHtmlId 排序
    allSongs.sort((a, b) => a.atwikiHtmlId - b.atwikiHtmlId);

    // 保存结果
    fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(allSongs, null, 2), 'utf-8');

    console.log(`\n✅ 已保存: ${CONFIG.outputFile}`);

    // 显示示例
    console.log(`\n🎵 示例数据（前10首）:`);
    allSongs.slice(0, 10).forEach((song, i) => {
      console.log(`  ${i + 1}. ${song.title}`);
      console.log(`     Artist: ${song.artist}`);
      console.log(`     atwikiHtmlId: ${song.atwikiHtmlId}`);
    });

    // 显示 ID 范围
    if (allSongs.length > 0) {
      const ids = allSongs.map(s => s.atwikiHtmlId);
      console.log(`\n📊 atwikiHtmlId 范围: ${Math.min(...ids)} ~ ${Math.max(...ids)}`);
    }

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
