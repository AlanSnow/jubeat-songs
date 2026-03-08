/**
 * 从 atwiki 曲列表中提取各版本的难度数据
 *
 * 用法:
 *   node scripts/extract-version-difficulties.js
 *
 * 处理 atwiki/曲リスト(*).html 文件，提取每个版本的难度数据
 * 并合并到 songs.json 中
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // atwiki HTML 文件目录
  atwikiDir: './sources/atwiki',
  // 数据来源
  songsFile: './data/songs.json',
  // 输出文件
  outputFile: './data/songs.json',
  tsOutputFile: './data/songs.ts',
  // 匹配曲列表文件的模式
  listFilePattern: /^曲リスト\((.+)\)\.html$/,
};

// 版本名称映射（从文件名到内部版本名）
const VERSION_MAPPING = {
  'jubeat初代': 'jubeat',
  'ripples': 'ripples',
  'knit': 'knit',
  'copious': 'copious',
  'saucer': 'saucer',
  'saucer fulfill': 'saucer fulfill',
  'prop': 'prop',
  'qubell': 'Qubell',
  'clan': 'clan',
  'festo': 'festo',
  'Ave._新曲': 'Ave.',
  'Ave._旧曲': 'Ave.',
  'b_Ave._新曲': 'Beyond the Ave.',
  'b_Ave._旧曲': 'Beyond the Ave.',
};

// 清理文本
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/◆/g, '')
    .replace(/\[\d+\]/g, '')  // 移除 [2] [3] 标记
    .trim();
}

// 标准化歌曲名（用于匹配）
function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[\s\(\)（）\[\]『』「」]/g, '')
    .replace(/[!！?？]/g, '')
    .trim();
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

// 解析单个版本的曲列表
function parseVersionFile(filePath, versionName) {
  console.log(`\n[解析] ${path.basename(filePath)} -> ${versionName}`);

  const html = fs.readFileSync(filePath, 'utf-8');
  const songs = [];

  // 匹配整个表格行
  const rowRegex = /<tr[^>]*class="atwiki_tr[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;

  // 匹配单元格
  const cellRegex = /<!--\d+-\d+--><td[^>]*>([\s\S]*?)<\/td>/g;

  // 匹配链接
  const linkRegex = /<a\s+href="([^"]+)"\s+title="[^"]*">([^<]*)<\/a>/;

  let rowMatch;
  let rowCount = 0;
  let skippedRows = 0;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // 提取所有单元格
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1]);
    }

    // 检查是否有足够的列（至少需要曲名+艺术家+BPM+6个难度列）
    if (cells.length < 8) {
      skippedRows++;
      continue;
    }

    // 第一个单元格是曲名
    const titleCell = cells[0];
    const linkMatch = titleCell.match(linkRegex);

    if (!linkMatch) {
      // 可能是标题行或分隔行，跳过
      continue;
    }

    // 提取曲名
    let title = cleanText(decodeHtmlEntities(linkMatch[2]));

    // 提取艺术家（使用列号1，处理某些行缺失Artist列的情况）
    const artistCell = cells.find((c, i) => {
      // 找到列号1的单元格（曲名是列0，艺术家是列1）
      const match = c.match(/<!--\d+-1-->/);
      return match;
    }) || cells[1]; // 回退到索引1
    let artist = cleanText(decodeHtmlEntities(artistCell ? artistCell.replace(/<[^>]+>/g, '') : ''));

    if (!title) {
      continue;
    }

    // 解析难度数据
    // 使用 HTML 注释中的列索引来映射数据，处理某些行缺失 Artist 列的情况
    // 标准格式: 0=曲名, 1=艺术家, 2=BPM, 3=BSC_Lv, 4=ADV_Lv, 5=EXT_Lv, 6=BSC_Notes, 7=ADV_Notes, 8=EXT_Notes

    let bscLv = 0, advLv = 0, extLv = 0, bscNotes = 0, advNotes = 0, extNotes = 0;

    // 尝试解析数值
    const parseValue = (text) => {
      const match = text.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };

    // 提取列号到值的映射（从 HTML 注释 <!--行-列--> 中提取列号）
    const colMap = new Map();
    const cellRegexWithCol = /<!--\d+-(\d+)--><td[^>]*>([\s\S]*?)<\/td>/g;
    let colCellMatch;
    while ((colCellMatch = cellRegexWithCol.exec(rowHtml)) !== null) {
      const colIndex = parseInt(colCellMatch[1], 10);
      const cellContent = colCellMatch[2];
      colMap.set(colIndex, cellContent);
    }

    // 检测是否是初代（没有BPM列，只有8列）
    const isJubeat1 = versionName === 'jubeat' && cells.length === 8;

    if (isJubeat1) {
      // 初代格式: 0=曲名, 1=艺术家, 2=BSC_Lv, 3=ADV_Lv, 4=EXT_Lv, 5=BSC_Notes, 6=ADV_Notes, 7=EXT_Notes
      bscLv = parseValue(colMap.get(2) || '');
      advLv = parseValue(colMap.get(3) || '');
      extLv = parseValue(colMap.get(4) || '');
      bscNotes = parseValue(colMap.get(5) || '');
      advNotes = parseValue(colMap.get(6) || '');
      extNotes = parseValue(colMap.get(7) || '');
    } else {
      // 标准格式: 使用列号映射，这样即使某些列缺失也能正确解析
      bscLv = parseValue(colMap.get(3) || '');
      advLv = parseValue(colMap.get(4) || '');
      extLv = parseValue(colMap.get(5) || '');
      bscNotes = parseValue(colMap.get(6) || '');
      advNotes = parseValue(colMap.get(7) || '');
      extNotes = parseValue(colMap.get(8) || '');
    }

    // 只保存有有效难度的歌曲
    if (extLv > 0) {
      songs.push({
        title,
        artist,
        matchKey: normalizeTitle(title),
        version: versionName,
        difficulties: {
          basic: { level: bscLv, notes: bscNotes },
          advanced: { level: advLv, notes: advNotes },
          extreme: { level: extLv, notes: extNotes },
        },
      });
      rowCount++;
    }
  }

  console.log(`  提取: ${rowCount} 首 (跳过: ${skippedRows} 行)`);
  return songs;
}

// 主函数
function main() {
  try {
    // 1. 读取现有歌曲数据
    console.log('[读取] 加载歌曲数据...');
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
      .map(name => ({
        name,
        path: path.join(CONFIG.atwikiDir, name),
        match: name.match(CONFIG.listFilePattern),
      }));

    console.log(`\n发现 ${files.length} 个曲列表文件`);

    // 4. 解析所有版本文件
    const allVersionData = new Map(); // key: versionName, value: songs[]

    for (const file of files) {
      const versionKey = file.match[1];
      const versionName = VERSION_MAPPING[versionKey];

      if (!versionName) {
        console.log(`  [跳过] 未知版本: ${versionKey}`);
        continue;
      }

      const songs = parseVersionFile(file.path, versionName);

      if (!allVersionData.has(versionName)) {
        allVersionData.set(versionName, []);
      }
      allVersionData.get(versionName).push(...songs);
    }

    // 5. 合并数据到现有歌曲
    console.log(`\n=== 合并数据 ===`);

    // 创建歌曲查找映射
    const songMap = new Map();
    songsData.forEach((song, index) => {
      const key = normalizeTitle(song.title);
      if (!songMap.has(key)) {
        songMap.set(key, []);
      }
      songMap.get(key).push({ song, index });
    });

    let updatedCount = 0;
    let versionStats = {};

    // 遍历每个版本的数据
    allVersionData.forEach((versionSongs, versionName) => {
      let versionMatched = 0;

      versionSongs.forEach(vSong => {
        const candidates = songMap.get(vSong.matchKey);

        if (candidates && candidates.length > 0) {
          // 找到匹配的歌曲
          candidates.forEach(({ song, index }) => {
            // 初始化 versionDifficulties
            if (!songsData[index].versionDifficulties) {
              songsData[index].versionDifficulties = {};
            }

            // 添加该版本的难度数据
            songsData[index].versionDifficulties[versionName] = {
              version: versionName,
              ...vSong.difficulties,
            };

            versionMatched++;
            updatedCount++;
          });
        }
      });

      versionStats[versionName] = versionMatched;
      console.log(`  ${versionName}: ${versionMatched} 首匹配`);
    });

    console.log(`\n总计更新: ${updatedCount} 条版本难度数据`);

    // 6. 统计有多少歌曲有版本难度数据
    const songsWithVersionData = songsData.filter(s => s.versionDifficulties && Object.keys(s.versionDifficulties).length > 0);
    console.log(`有版本难度数据的歌曲: ${songsWithVersionData.length}/${songsData.length}`);

    // 7. 显示一些示例
    console.log(`\n示例（有版本难度数据的歌曲）:`);
    songsWithVersionData.slice(0, 5).forEach(song => {
      const versions = Object.keys(song.versionDifficulties);
      console.log(`  - ${song.title}:`);
      versions.forEach(v => {
        const d = song.versionDifficulties[v];
        console.log(`      ${v}: EXT ${d.extreme.level}`);
      });
    });

    // 8. 保存结果
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(songsData, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.outputFile}`);

    // 9. 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(songsData, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

    // 10. 显示 Far east nightbird 示例（如果存在）
    const fen = songsData.find(s => s.title.toLowerCase().includes('far east nightbird'));
    if (fen && fen.versionDifficulties) {
      console.log(`\n📝 Far east nightbird 版本难度变化:`);
      Object.entries(fen.versionDifficulties).forEach(([v, d]) => {
        console.log(`  - ${v}: EXT ${d.extreme.level}`);
      });
    }

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
