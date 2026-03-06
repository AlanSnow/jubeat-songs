/**
 * BEMANI Wiki jubeat 曲目爬虫 - 完整版
 * 提取：配信日期、版本、难度数据
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const CONFIG = {
  devMode: true,
  cacheDir: './cache',
  outputFile: './data/songs-full.json',
  pages: {
    newSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8',
    oldSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%B5%EC%B6%CA%A5%EA%A5%B9%A5%C8',
    deletedSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%BA%EF%BD%FC%B6%CA%A5%EA%A5%B9%A5%C8',
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadPage(url, cacheFile) {
  if (CONFIG.devMode && fs.existsSync(cacheFile)) {
    console.log(`[CACHE] ${cacheFile}`);
    return fs.readFileSync(cacheFile, 'utf-8');
  }

  console.log(`[DOWNLOAD] ${url}`);
  return new Promise((resolve, reject) => {
    https.get(new URL(url), {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const html = iconv.decode(Buffer.concat(chunks), 'euc-jp');
        ensureDir(path.dirname(cacheFile));
        fs.writeFileSync(cacheFile, html, 'utf-8');
        resolve(html);
      });
    }).on('error', reject);
  });
}

// 清理文本
function cleanText(text) {
  return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

// 提取日期 from "2022/08/03配信" or "稼働時(2022/08/03)配信"
function extractDate(text) {
  const match = text.match(/(\d{4}\/\d{2}\/\d{2})/);
  return match ? match[1].replace(/\//g, '-') : '';
}

// 解析歌曲表格（带上下文）
function parseTablesWithContext($) {
  const songs = [];
  let currentDate = '';
  let currentVersion = '';
  let currentEvent = '';

  $('table.style_table').each((tableIdx, table) => {
    const $table = $(table);
    
    // 检查表头
    const headerText = $table.find('thead, tr:first').text();
    const hasCategory = headerText.includes('カテゴリ');
    const isSongTable = headerText.includes('BSC') && headerText.includes('ADV');
    
    if (!isSongTable) return;

    console.log(`  表格 #${tableIdx} (${hasCategory ? '有分类' : '无分类'})`);
    
    // 解析表格行
    const rows = $table.find('tr');
    let count = 0;
    let versionDetected = false;
    
    rows.each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      // 检查是否是版本标题行 (colspan 很大的行)
      const firstCell = cells.first();
      const colspan = parseInt(firstCell.attr('colspan')) || 0;
      
      if (colspan >= 9) {
        // 可能是版本标题或日期标题
        const text = $row.text();
        
        // 提取版本
        const versionMatch = text.match(/jubeat\s+(knit|copious|saucer\s+fulfill|saucer|prop|festo|clan|Qubell|ripples|Ave)/i);
        if (versionMatch) {
          currentVersion = `jubeat ${versionMatch[1].toLowerCase()}`;
          versionDetected = true;
          console.log(`    → 版本: ${currentVersion}`);
        }
        
        // 提取日期
        if (text.includes('配信')) {
          currentDate = extractDate(text);
          currentEvent = text.includes('～') ? cleanText(text.split('～')[0]) : '';
        }
        
        return; // 跳过标题行
      }
      
      // 跳过表头行
      if (cells.length < 7 || cells.first().find('td[rowspan]').length) return;
      
      // 解析歌曲行
      const song = parseRow($, cells, hasCategory);
      if (song && song.title && song.difficulties?.extreme?.level > 0) {
        song.releaseDate = currentDate;
        song.event = currentEvent;
        song.version = currentVersion || 'Ave.';
        songs.push(song);
        count++;
      }
    });
    
    console.log(`    解析: ${count} 首`);
  });
  
  return songs;
}

// 解析单行
function parseRow($, cells, hasCategory) {
  try {
    let idx = 0;
    const category = hasCategory ? $(cells[idx++]).text().trim() : '';
    
    const titleCell = $(cells[idx++]);
    const title = cleanText(titleCell.text());
    
    // 提取副标题（括号内）
    const subtitle = titleCell.find('span').text();
    
    const artist = cleanText($(cells[idx++]).text());
    const bpm = parseInt($(cells[idx++]).text()) || 0;
    
    // 难度数据
    const bscLv = parseFloat($(cells[idx++]).text()) || 0;
    const bscNotes = parseInt($(cells[idx++]).text()) || 0;
    const advLv = parseFloat($(cells[idx++]).text()) || 0;
    const advNotes = parseInt($(cells[idx++]).text()) || 0;
    const extLv = parseFloat($(cells[idx++]).text()) || 0;
    const extNotes = parseInt($(cells[idx++]).text()) || 0;
    
    if (!title || !extLv) return null;
    
    return {
      id: `jbt-${title.replace(/[^\w]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      subtitle: subtitle || undefined,
      artist,
      genre: mapCategory(category),
      bpm,
      difficulties: {
        basic: { level: bscLv, notes: bscNotes },
        advanced: { level: advLv, notes: advNotes },
        extreme: { level: extLv, notes: extNotes }
      },
      isLicense: !artist.includes('BEMANI Sound Team'),
    };
  } catch (e) {
    return null;
  }
}

function mapCategory(cat) {
  const map = {
    'アニメ': 'アニメ',
    'ポップス': 'ポップス', 
    'アニメポップス': 'アニメ',
    'ソーシャル': 'ポップス',
    '東方アレンジ': '東方アレンジ',
    'バラエティ': 'バラエティ',
  };
  return map[cat.replace(/\n/g, '')] || 'ポップス';
}

async function main() {
  try {
    ensureDir(CONFIG.cacheDir);
    let allSongs = [];

    // 1. 新曲リスト
    console.log('\n=== 新曲リスト ===');
    const newHtml = await downloadPage(CONFIG.pages.newSongs, 
      path.join(CONFIG.cacheDir, 'new-songs.html'));
    const newSongs = parseTablesWithContext(cheerio.load(newHtml));
    console.log(`新曲: ${newSongs.length} 首`);
    allSongs.push(...newSongs);

    // 2. 旧曲リスト
    console.log('\n=== 旧曲リスト ===');
    const oldHtml = await downloadPage(CONFIG.pages.oldSongs,
      path.join(CONFIG.cacheDir, 'old-songs.html'));
    const oldSongs = parseTablesWithContext(cheerio.load(oldHtml));
    console.log(`旧曲: ${oldSongs.length} 首`);
    allSongs.push(...oldSongs);

    // 3. 去重
    const seen = new Set();
    allSongs = allSongs.filter(s => {
      const key = `${s.title}-${s.artist}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 4. 保存
    ensureDir(path.dirname(CONFIG.outputFile));
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(allSongs, null, 2));

    // 5. 统计
    console.log(`\n✅ 总计: ${allSongs.length} 首`);
    
    const versions = {};
    allSongs.forEach(s => {
      versions[s.version] = (versions[s.version] || 0) + 1;
    });
    console.log('\n📊 版本分布:', versions);
    
    const levels = {};
    allSongs.forEach(s => {
      const lv = Math.floor(s.difficulties.extreme.level);
      if (lv >= 1 && lv <= 10) levels[lv] = (levels[lv] || 0) + 1;
    });
    console.log('\n📊 难度分布:', levels);
    
    console.log('\n🎵 示例:');
    allSongs.slice(0, 3).forEach(s => {
      console.log(`  ${s.title} (${s.version})`);
      console.log(`    EXT: Lv.${s.difficulties.extreme.level} | ${s.releaseDate || 'N/A'}`);
    });

  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

main();
