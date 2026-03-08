/**
 * 解析 atwiki 歌曲详情页 HTML
 *
 * 用法:
 *   node scripts/parse-atwiki-detail.js
 *
 * 从 atwiki/pages/*.html 提取歌曲详细信息，合并到 songs.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // atwiki 详情页目录
  pagesDir: './sources/atwiki/pages',
  // 数据来源
  songsFile: './data/songs.json',
  // 输出文件
  outputFile: './data/songs.json',
  tsOutputFile: './data/songs.ts',
};

// 清理文本
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/<!--.*?-->/g, '')
    .trim();
}

// 标准化歌曲名（用于匹配）
// 只移除 [2] 后缀，因为带[2]和不带[2]的歌曲共享同一个详情页
function normalizeTitle(title) {
  return title.replace(/\[2\]/g, '');
}

// 解析单个页面
function parsePage(filePath) {
  const fileName = path.basename(filePath);
  const atwikiId = parseInt(fileName.replace('.html', ''), 10);

  console.log(`  解析: ${fileName}`);

  const html = fs.readFileSync(filePath, 'utf-8');

  // 提取标题（歌曲名）- 处理可能有多个 - 的情况
  const titleMatch = html.match(/<title>(.+?)\s+-\s+jubeat@Wiki/);
  const title = titleMatch ? cleanText(titleMatch[1]) : null;

  if (!title) {
    console.log(`    ⚠️ 无法提取歌曲名`);
    return null;
  }

  // 提取表格数据
  const tableData = {};
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];

    // 提取所有单元格
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(row)) !== null) {
      // 移除 HTML 标签
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(cellText);
    }

    // 如果第一列有标签，记录它
    if (cells.length >= 2 && cells[0]) {
      const label = cells[0];
      const value = cells.slice(1).filter(c => c).join(' ');
      if (label && value) {
        tableData[label] = value;
      }
    }
  }

  // 提取封面图片
  let jacketUrl = null;
  const jacketMatch = html.match(/<img[^>]*class=["'][^"']*atwiki_plugin_ref[^"']*["'][^>]*src=["']([^"']*)["']/i);
  if (jacketMatch) {
    jacketUrl = jacketMatch[1];
  } else {
    // 尝试其他格式
    const altMatch = html.match(/<img[^>]*alt=["'][^"']*ジャケット[^"']*["'][^>]*src=["']([^"']*)["']/i);
    if (altMatch) {
      jacketUrl = altMatch[1];
    }
  }

  // 构建结果
  const result = {
    atwikiId,
    title,
    matchKey: normalizeTitle(title),
    artist: tableData['Artist'] || null,
    genre: tableData['ジャンル'] || null,
    bpm: tableData['BPM'] || null,
    time: tableData['TIME'] || null,
    appearanceVersion: tableData['Version'] || null,
    level: {
      basic: null,
      advanced: null,
      extreme: null,
    },
    notes: {
      basic: null,
      advanced: null,
      extreme: null,
    },
    jacketUrl,
  };

  // 解析 Level
  if (tableData['Level']) {
    const levels = tableData['Level'].split(/\s+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (levels.length >= 1) result.level.basic = levels[0];
    if (levels.length >= 2) result.level.advanced = levels[1];
    if (levels.length >= 3) result.level.extreme = levels[2];
  }

  // 解析 Notes
  if (tableData['Notes']) {
    const notes = tableData['Notes'].split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
    if (notes.length >= 1) result.notes.basic = notes[0];
    if (notes.length >= 2) result.notes.advanced = notes[1];
    if (notes.length >= 3) result.notes.extreme = notes[2];
  }

  // 清理 null 值
  Object.keys(result).forEach(key => {
    if (result[key] === null) delete result[key];
  });

  console.log(`    ✅ ${title}${jacketUrl ? ' (有封面)' : ''}`);

  return result;
}

// 主函数
function main() {
  try {
    // 1. 读取现有歌曲数据
    console.log('[读取] 加载歌曲数据...');
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'));
    console.log(`  现有歌曲: ${songsData.length} 首`);

    // 2. 检查目录
    if (!fs.existsSync(CONFIG.pagesDir)) {
      console.error(`❌ 目录不存在: ${CONFIG.pagesDir}`);
      process.exit(1);
    }

    // 3. 获取所有页面文件
    const files = fs.readdirSync(CONFIG.pagesDir)
      .filter(name => name.endsWith('.html'))
      .map(name => ({
        name,
        path: path.join(CONFIG.pagesDir, name),
        id: parseInt(name.replace('.html', ''), 10),
      }))
      .filter(f => !isNaN(f.id))
      .sort((a, b) => a.id - b.id);

    console.log(`\n发现 ${files.length} 个页面文件`);

    // 4. 解析所有页面
    const parsedData = [];
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const data = parsePage(file.path);
      if (data) {
        parsedData.push(data);
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n解析完成: ${successCount} 成功, ${failCount} 失败`);

    // 5. 创建歌曲查找映射
    const songMap = new Map();
    songsData.forEach((song, index) => {
      const key = normalizeTitle(song.title);
      if (!songMap.has(key)) {
        songMap.set(key, []);
      }
      songMap.get(key).push({ song, index });
    });

    // 6. 合并数据
    console.log(`\n=== 合并数据 ===`);
    let matchedCount = 0;
    let updatedFields = {
      avatar: 0,
      bpm: 0,
      time: 0,
      genre: 0,
      appearanceVersion: 0,
    };

    parsedData.forEach((data) => {
      const candidates = songMap.get(data.matchKey);

      if (candidates && candidates.length > 0) {
        matchedCount++;

        candidates.forEach(({ song, index }) => {
          // 更新 atwikiHtmlId
          songsData[index].atwikiHtmlId = data.atwikiId;

          // 更新封面
          if (data.jacketUrl && !songsData[index].avatar) {
            songsData[index].avatar = data.jacketUrl;
            updatedFields.avatar++;
          }

          // 更新 BPM（如果现有数据缺失或不同）
          if (data.bpm) {
            const bpmNum = parseFloat(data.bpm);
            if (!isNaN(bpmNum) && (!songsData[index].bpm || songsData[index].bpm === 0)) {
              songsData[index].bpm = bpmNum;
              updatedFields.bpm++;
            }
          }

          // 更新 Time
          if (data.time && !songsData[index].time) {
            songsData[index].time = data.time;
            updatedFields.time++;
          }

          // 更新 Genre（如果现有数据缺失或为默认值'ポップス'）
          if (data.genre && (!songsData[index].genre || songsData[index].genre === '未知' || songsData[index].genre === 'ポップス')) {
            songsData[index].genre = data.genre;
            updatedFields.genre++;
          }

          // 更新 Appearance Version（如果现有数据缺失）
          if (data.appearanceVersion && !songsData[index].appearanceVersion) {
            songsData[index].appearanceVersion = data.appearanceVersion;
            updatedFields.appearanceVersion++;
          }
        });
      }
    });

    console.log(`\n匹配歌曲: ${matchedCount}/${parsedData.length}`);
    console.log('更新字段:');
    Object.entries(updatedFields).forEach(([field, count]) => {
      console.log(`  ${field}: ${count}`);
    });

    // 7. 统计 atwikiHtmlId 覆盖情况
    const withAtwikiId = songsData.filter(s => s.atwikiHtmlId).length;
    console.log(`\n有 atwikiHtmlId 的歌曲: ${withAtwikiId}/${songsData.length}`);

    // 7.5 统计 [2] 歌曲的 genre 覆盖情况
    const songsWithBracket2 = songsData.filter(s => s.title.includes('[2]'));
    const bracket2WithGenre = songsWithBracket2.filter(s => s.genre && s.genre !== '未知' && s.genre !== 'ポップス').length;
    console.log(`\n带 [2] 的歌曲: ${songsWithBracket2.length} 首`);
    console.log(`  - 有 genre 的: ${bracket2WithGenre}/${songsWithBracket2.length}`);
    if (songsWithBracket2.length > 0 && bracket2WithGenre < songsWithBracket2.length) {
      console.log('  - 缺少 genre 的 [2] 歌曲:');
      songsWithBracket2
        .filter(s => !s.genre || s.genre === '未知' || s.genre === 'ポップス')
        .forEach(s => console.log(`    * "${s.title}" (atwikiId: ${s.atwikiHtmlId})`));
    }

    // 8. 保存结果
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(songsData, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.outputFile}`);

    // 9. 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(songsData, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

    // 10. 显示示例
    console.log(`\n示例（更新后的歌曲）:`);
    songsData.filter(s => s.atwikiHtmlId).slice(0, 3).forEach(song => {
      console.log(`  - ${song.title}:`);
      console.log(`      atwikiId: ${song.atwikiHtmlId}`);
      if (song.avatar) console.log(`      avatar: ${song.avatar.substring(0, 50)}...`);
      if (song.time) console.log(`      time: ${song.time}`);
      if (song.appearanceVersion) console.log(`      appearanceVersion: ${song.appearanceVersion}`);
    });

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
