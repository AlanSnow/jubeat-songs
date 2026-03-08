/**
 * 从 BEMANI Wiki HTML 中提取谱面标记数据
 *
 * 用法:
 *   node scripts/extract-chart-patterns.js
 *
 * 处理 bemaniwiki/BTA/ 下的 HTML 文件，提取:
 *   - 詐称/逆詐称/個人差 (难度评级)
 *   - 文字押/図形押 (特殊图案)
 * 并将数据合并到 songs.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // BEMANI Wiki HTML 文件目录
  bemaniDir: './sources/bemaniwiki/BTA',
  // 数据来源
  songsFile: './data/songs.json',
  // 输出文件
  outputFile: './data/songs.json',
  tsOutputFile: './data/songs.ts',
};

// 标记类型映射
const MARKER_TYPES = {
  'sahyou': { color: 'red', label: '詐称', labelCn: '诈称' },
  'gyakusahyou': { color: 'blue', label: '逆詐称', labelCn: '逆诈称' },
  'kojinsa': { color: 'purple', label: '個人差', labelCn: '个人差' },
};

// 难度颜色映射 (BEMANI Wiki 中的背景色)
const DIFFICULTY_COLORS = {
  'green': 'basic',      // BSC
  'orange': 'advanced',  // ADV
  'red': 'extreme',      // EXT
  '#ff3333': 'extreme',  // EXT (另一种红色)
};

// 清理文本
function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\[\s*\d+\s*\]/g, '')  // 移除 [ 2 ] 这样的标记
    .replace(/\s+/g, ' ')
    .trim();
}

// 标准化歌曲名（用于匹配）
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\s\(\)（）\[\]『』「」'"'"']/g, '')
    .replace(/[!！?？]/g, '')
    .replace(/[♪♥♡☆★]/g, '')  // 移除装饰符号
    .trim();
}

// 解析 文字ネタ・図形ネタ.html (文字押/图形押)
function parseTextShapePatterns(filePath) {
  console.log(`\n[解析] 文字押・图形押: ${path.basename(filePath)}`);

  const html = fs.readFileSync(filePath, 'utf-8');
  const patterns = [];

  // 匹配表格行
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  // 匹配单元格
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

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

    // 需要至少4个单元格: 曲名 + BSC + ADV + EXT
    if (cells.length < 4) continue;

    // 第一个单元格是曲名
    const title = cleanText(cells[0]);
    if (!title) continue;

    // 解析每个难度的图案
    const difficultyPatterns = {
      basic: extractPatternsFromCell(cells[1]),
      advanced: extractPatternsFromCell(cells[2]),
      extreme: extractPatternsFromCell(cells[3]),
    };

    // 只保存有图案的歌曲
    const hasPatterns = Object.values(difficultyPatterns).some(
      p => p.length > 0
    );

    if (hasPatterns) {
      patterns.push({
        title,
        matchKey: normalizeTitle(title),
        patterns: difficultyPatterns,
      });
      rowCount++;
    }
  }

  console.log(`  提取: ${rowCount} 首有图案的歌曲`);
  return patterns;
}

// 从单元格提取图案描述
function extractPatternsFromCell(cellHtml) {
  const patterns = [];

  // 红色文字表示非同时押的图案
  const redSpanRegex = /<span[^>]*style="[^"]*color:red[^"]*"[^>]*>(.*?)<\/span>/g;
  let match;

  while ((match = redSpanRegex.exec(cellHtml)) !== null) {
    const text = cleanText(match[1]);
    if (text && text.length > 0) {
      patterns.push({
        type: 'shape',
        description: text,
      });
    }
  }

  // 清理非红色文字（移除HTML标签后的普通文本）
  const allText = cleanText(cellHtml.replace(/<[^>]+>/g, ''));

  // 如果有非红色文字且不是空格，也作为普通文本记录下来
  if (allText && allText.length > 0 && allText !== ',') {
    // 避免重复记录红色文字
    const existingDescriptions = patterns.map(p => p.description).join('');
    if (!existingDescriptions.includes(allText)) {
      patterns.push({
        type: 'text',
        description: allText,
      });
    }
  }

  return patterns;
}

// 解析 詐称・逆詐称譜面リスト HTML
function parseDifficultyRatings(filePath, fileType) {
  console.log(`\n[解析] 詐称・逆詐称 (${fileType}): ${path.basename(filePath)}`);

  const html = fs.readFileSync(filePath, 'utf-8');
  const ratings = [];
  let count = 0;

  // 按分类解析：先找到每个标记类型的部分
  const sections = [
    { type: 'sahyou', color: 'red', label: '詐称' },
    { type: 'gyakusahyou', color: 'blue', label: '逆詐称' },
    { type: 'kojinsa', color: 'purple', label: '個人差' },
  ];

  sections.forEach((section) => {
    // 找到该分类的开始位置
    let sectionStart = 0;
    const sectionRegex = new RegExp(
      `<span[^>]*style="[^"]*color:${section.color}[^"]*"[^>]*>${section.label}</span>`,
      'g'
    );

    let sectionMatch;
    while ((sectionMatch = sectionRegex.exec(html)) !== null) {
      // 获取该分类下的歌曲条目
      const startPos = sectionMatch.index;
      const endPos = findNextSectionStart(html, startPos + 1, sections);
      const sectionHtml = html.substring(startPos, endPos);

      // 解析该分类下的歌曲 - 支持两种格式:
      // 格式1: <li><span style="color:red"><strong>曲名</strong></span> [<span>难度</span>] (版本)
      // 格式2: <li>Lv9.0:<span style="color:red">曲名</span> [<span>难度</span>] (版本)
      const songRegex =
        /<li[^>]*>(?:Lv[\d.]+:?)?\s*<span[^>]*style="[^"]*color:[^"]*"[^>]*>(?:<strong>)?([^<]+)(?:<\/strong>)?<\/span>\s*\[<span[^>]*style="[^"]*background-color:([^"]+)[^"]*"[^>]*>([^<]+)<\/span>\](?:\s*\(([^)]+)\))?/gi;

      let songMatch;
      while ((songMatch = songRegex.exec(sectionHtml)) !== null) {
        const title = cleanText(songMatch[1]);
        const bgColor = songMatch[2];
        const diffText = songMatch[3];
        const version = (songMatch[4] || '').trim();

        if (!title) continue;

        // 解析难度
        let difficulty = DIFFICULTY_COLORS[bgColor];
        if (!difficulty) {
          if (diffText.includes('BSC')) difficulty = 'basic';
          else if (diffText.includes('ADV')) difficulty = 'advanced';
          else if (diffText.includes('EXT')) difficulty = 'extreme';
        }

        ratings.push({
          title,
          matchKey: normalizeTitle(title),
          type: section.type,
          difficulty,
          version,
        });
        count++;
      }
    }
  });

  console.log(`  提取: ${count} 条评级数据`);
  return ratings;
}

// 找到下一个分类的开始位置
function findNextSectionStart(html, currentPos, sections) {
  let minPos = html.length;
  sections.forEach((section) => {
    const regex = new RegExp(
      `<span[^>]*style="[^"]*color:${section.color}[^"]*"[^>]*>${section.label}</span>`
    );
    const match = html.substring(currentPos).match(regex);
    if (match && match.index !== undefined) {
      const actualPos = currentPos + match.index;
      if (actualPos < minPos && actualPos > currentPos) {
        minPos = actualPos;
      }
    }
  });

  // 也检查章节标题 (如 <h3 id="content_1_2">Lv9</h3>)
  const levelSectionRegex = /<h[34][^>]*>Lv[\d-]+/i;
  const levelMatch = html.substring(currentPos).match(levelSectionRegex);
  if (levelMatch && levelMatch.index !== undefined) {
    const actualPos = currentPos + levelMatch.index;
    if (actualPos < minPos && actualPos > currentPos) {
      minPos = actualPos;
    }
  }

  return minPos;
}

// 主函数
function main() {
  try {
    // 1. 读取现有歌曲数据
    console.log('[读取] 加载歌曲数据...');
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'))
;
    console.log(`  现有歌曲: ${songsData.length} 首`);

    // 2. 检查目录
    if (!fs.existsSync(CONFIG.bemaniDir)) {
      console.error(`❌ 目录不存在: ${CONFIG.bemaniDir}`);
      process.exit(1);
    }

    // 3. 解析文字押・图形押
    const textShapeFile = path.join(CONFIG.bemaniDir, '文字ネタ・図形ネタ.html');
    let textShapePatterns = [];
    if (fs.existsSync(textShapeFile)) {
      textShapePatterns = parseTextShapePatterns(textShapeFile);
    }

    // 4. 解析詐称・逆詐称文件
    const ratingFiles = [
      { name: '新曲詐称・逆詐称・個人差譜面リスト.html', type: 'new' },
      { name: '旧曲Lv1～Lv8 詐称・逆詐称譜面リスト.html', type: 'old1-8' },
      { name: '旧曲Lv9・Lv10 詐称・逆詐称譜面リスト.html', type: 'old9-10' },
    ];

    let allRatings = [];
    for (const file of ratingFiles) {
      const filePath = path.join(CONFIG.bemaniDir, file.name);
      if (fs.existsSync(filePath)) {
        const ratings = parseDifficultyRatings(filePath, file.type);
        allRatings.push(...ratings);
      }
    }

    // 5. 创建歌曲查找映射
    const songMap = new Map();
    songsData.forEach((song, index) => {
      const key = normalizeTitle(song.title);
      if (!songMap.has(key)) {
        songMap.set(key, []);
      }
      songMap.get(key).push({ song, index });
    });

    // 6. 合并文字押・图形押数据
    console.log(`\n=== 合并文字押・图形押数据 ===`);
    let patternCount = 0;

    textShapePatterns.forEach((pattern) => {
      const candidates = songMap.get(pattern.matchKey);
      if (candidates && candidates.length > 0) {
        candidates.forEach(({ index }) => {
          // 初始化 chartPatterns
          if (!songsData[index].chartPatterns) {
            songsData[index].chartPatterns = {};
          }

          // 合并每个难度的图案
          ['basic', 'advanced', 'extreme'].forEach((diff) => {
            if (pattern.patterns[diff].length > 0) {
              if (!songsData[index].chartPatterns[diff]) {
                songsData[index].chartPatterns[diff] = [];
              }

              // 去重：检查是否已存在相同描述的图案
              pattern.patterns[diff].forEach((newPattern) => {
                const exists = songsData[index].chartPatterns[diff].some(
                  (p) => p.description === newPattern.description && p.type === newPattern.type
                );
                if (!exists) {
                  songsData[index].chartPatterns[diff].push(newPattern);
                  patternCount++;
                }
              });
            }
          });
        });
      }
    });
    console.log(`  合并: ${patternCount} 条图案数据`);

    // 7. 合并詐称・逆詐称数据
    console.log(`\n=== 合并詐称・逆詐称数据 ===`);
    let ratingMergeCount = 0;

    allRatings.forEach((rating) => {
      const candidates = songMap.get(rating.matchKey);
      if (candidates && candidates.length > 0) {
        candidates.forEach(({ index }) => {
          // 如果没有 chartPatterns，初始化
          if (!songsData[index].chartPatterns) {
            songsData[index].chartPatterns = {};
          }

          // 确定应用到哪些难度
          const difficultiesToApply = rating.difficulty
            ? [rating.difficulty]
            : ['basic', 'advanced', 'extreme'];

          difficultiesToApply.forEach((diff) => {
            if (!songsData[index].chartPatterns[diff]) {
              songsData[index].chartPatterns[diff] = [];
            }

            // 检查是否已存在相同类型的标记
            const exists = songsData[index].chartPatterns[diff].some(
              (p) => p.type === rating.type
            );

            if (!exists) {
              songsData[index].chartPatterns[diff].push({
                type: rating.type,
                label: MARKER_TYPES[rating.type].labelCn,
              });
              ratingMergeCount++;
            }
          });
        });
      }
    });
    console.log(`  合并: ${ratingMergeCount} 条评级数据`);

    // 8. 统计结果
    const songsWithPatterns = songsData.filter(
      (s) => s.chartPatterns && Object.keys(s.chartPatterns).length > 0
    );
    console.log(`\n有谱面标记数据的歌曲: ${songsWithPatterns.length}/${songsData.length}`);

    // 9. 显示示例
    console.log(`\n示例（有谱面标记的歌曲）:`);
    songsWithPatterns.slice(0, 5).forEach((song) => {
      console.log(`  - ${song.title}:`);
      Object.entries(song.chartPatterns).forEach(([diff, patterns]) => {
        const patternStr = patterns.map((p) => p.label || p.description).join(', ');
        console.log(`      ${diff}: ${patternStr}`);
      });
    });

    // 10. 保存结果
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(songsData, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.outputFile}`);

    // 11. 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(songsData, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
