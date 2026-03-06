/**
 * 完整数据爬虫 - 最终修复版
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const CONFIG = {
  devMode: false, // 强制重新下载
  cacheDir: '../cache',
  outputFile: '../data/songs-complete.json',
  pages: {
    oldSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%B5%EC%B6%CA%A5%EA%A5%B9%A5%C8',
    aveNew: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8',
    btaNew: 'https://bemaniwiki.com/?jubeat+beyond+the+Ave.%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8',
  }
};

const VERSION_ORDER = [
  'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 
  'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function downloadPage(url, cacheFile) {
  if (CONFIG.devMode && fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf-8');
  }
  return new Promise((resolve, reject) => {
    https.get(new URL(url), { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function mapCategory(cat) {
  const map = {
    'アニメ': 'アニメ',
    'ポップス': 'ポップス',
    'アニメポップス': 'アニメ',
    'ソーシャル': 'ポップス',
    '東方アレンジ': '東方アレンジ',
    'バラエティ': 'バラエティ',
    'ナムコオリジナル': 'ナムコオリジナル',
    'コナミオリジナル': 'コナミオリジナル',
    'オリジナル': 'コナミオリジナル',
    'クラシック': 'バラエティ',
    'ゲーム': 'バラエティ',
  };
  return map[cat] || 'ポップス';
}

// 解析旧曲 - 11列表格：伝導、分類、曲名、アーティスト、BPM、BSC×2、ADV×2、EXT×2
function parseOldSongs($) {
  const songs = [];
  let currentVersion = '';
  
  $('table.style_table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.find('tr:first').text();
    if (!headerText.includes('BSC')) return;
    
    $table.find('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length === 0) return;
      
      const colspan = parseInt($(cells[0]).attr('colspan')) || 0;
      const rowText = $(row).text();
      
      // 版本标题行 (colspan=11 或包含 jubeat 版本名)
      if (colspan >= 9) {
        // 尝试从文本匹配
        const match = rowText.match(/jubeat\s+(ripples|knit|copious|saucer\s+fulfill|saucer|prop|festo|clan|Qubell)/i);
        if (match) {
          currentVersion = match[1].toLowerCase();
          console.log(`  → ${currentVersion}`);
        } else if (rowText.toLowerCase().includes('jubeat')) {
          // 尝试从 HTML 提取 id
          const html = $(row).html() || '';
          const idMatch = html.match(/id="(ripples|knit|copious|saucer_fulfill|saucer|prop|festo|clan|qubell)"/i);
          if (idMatch) {
            currentVersion = idMatch[1].replace('_', ' ').toLowerCase();
            console.log(`  → ${currentVersion} (from id)`);
          }
        }
        return;
      }
      
      // 跳过表头和无效行
      if (i <= 1) return;
      
      // 数据行需要至少10列
      if (cells.length < 10) return;
      
      try {
        // 旧曲表格：cells[0]=伝導, [1]=分類, [2]=曲名, [3]=アーティスト, [4]=BPM, [5-10]=難易度
        const genre = $(cells[1]).text().trim();
        const title = cleanText($(cells[2]).text());
        const artist = cleanText($(cells[3]).text());
        const bpm = parseInt($(cells[4]).text()) || 0;
        
        const bscLv = parseFloat($(cells[5]).text()) || 0;
        const bscNotes = parseInt($(cells[6]).text()) || 0;
        const advLv = parseFloat($(cells[7]).text()) || 0;
        const advNotes = parseInt($(cells[8]).text()) || 0;
        const extLv = parseFloat($(cells[9]).text()) || 0;
        const extNotes = parseInt($(cells[10]).text()) || 0;
        
        if (title && extLv && currentVersion) {
          songs.push({
            id: `jbt-${title.replace(/[^\w]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`,
            title,
            artist,
            bpm,
            genre: mapCategory(genre),
            difficulties: {
              basic: { level: bscLv, notes: bscNotes },
              advanced: { level: advLv, notes: advNotes },
              extreme: { level: extLv, notes: extNotes }
            },
            firstAppearance: currentVersion,
            releaseDate: '',
            deletedDate: '',
            deletedIn: '',
            isLicense: !artist.includes('BEMANI Sound Team')
          });
        }
      } catch (e) {}
    });
  });
  
  return songs;
}

// 解析新曲 - 9列表格：分類、曲名、アーティスト、BPM、BSC×2、ADV×2、EXT×2
function parseNewSongs($, defaultVersion) {
  const songs = [];
  let currentDate = '';
  let currentVersion = defaultVersion;
  
  $('table.style_table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.find('tr:first').text();
    if (!headerText.includes('BSC')) return;
    
    $table.find('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 9) return;
      
      const colspan = parseInt($(cells[0]).attr('colspan')) || 0;
      if (colspan >= 9) {
        const text = $(row).text();
        const dateMatch = text.match(/(\d{4}\/\d{2}\/\d{2})/);
        if (dateMatch) currentDate = dateMatch[0].replace(/\//g, '-');
        return;
      }
      
      if (i <= 1) return;
      
      try {
        // 新曲表格：cells[0]=分類, [1]=曲名, [2]=アーティスト, [3]=BPM, [4-9]=難易度
        const hasCategory = headerText.includes('カテゴリ');
        let idx = 0;
        
        const genre = hasCategory ? $(cells[idx++]).text().trim() : '';
        const title = cleanText($(cells[idx++]).text());
        const artist = cleanText($(cells[idx++]).text());
        const bpm = parseInt($(cells[idx++]).text()) || 0;
        
        const bscLv = parseFloat($(cells[idx++]).text()) || 0;
        const bscNotes = parseInt($(cells[idx++]).text()) || 0;
        const advLv = parseFloat($(cells[idx++]).text()) || 0;
        const advNotes = parseInt($(cells[idx++]).text()) || 0;
        const extLv = parseFloat($(cells[idx++]).text()) || 0;
        const extNotes = parseInt($(cells[idx++]).text()) || 0;
        
        if (title && extLv) {
          songs.push({
            id: `jbt-${title.replace(/[^\w]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`,
            title,
            artist,
            bpm,
            genre: mapCategory(genre),
            difficulties: {
              basic: { level: bscLv, notes: bscNotes },
              advanced: { level: advLv, notes: advNotes },
              extreme: { level: extLv, notes: extNotes }
            },
            firstAppearance: currentVersion,
            releaseDate: currentDate,
            deletedDate: '',
            deletedIn: '',
            isLicense: !artist.includes('BEMANI Sound Team')
          });
        }
      } catch (e) {}
    });
  });
  
  return songs;
}

// 计算 versionHistory
function calculateVersionHistory(songs) {
  return songs.map(song => {
    const firstIdx = VERSION_ORDER.indexOf(song.firstAppearance);
    let lastIdx = song.deletedIn ? 
      VERSION_ORDER.indexOf(song.deletedIn) - 1 :
      VERSION_ORDER.length - 1;
    
    if (firstIdx === -1) {
      song.versionHistory = [song.firstAppearance];
      return song;
    }
    if (lastIdx < firstIdx) lastIdx = firstIdx;
    
    song.versionHistory = VERSION_ORDER.slice(firstIdx, lastIdx + 1);
    return song;
  });
}

async function main() {
  try {
    ensureDir(CONFIG.cacheDir);
    let allSongs = [];
    
    console.log('爬取旧曲リスト...');
    const oldHtml = await downloadPage(CONFIG.pages.oldSongs,
      path.join(CONFIG.cacheDir, 'old-songs.html'));
    const oldSongs = parseOldSongs(cheerio.load(oldHtml));
    console.log(`  ${oldSongs.length} 首`);
    allSongs.push(...oldSongs);
    
    console.log('爬取 Ave. 新曲...');
    const aveHtml = await downloadPage(CONFIG.pages.aveNew,
      path.join(CONFIG.cacheDir, 'new-songs.html'));
    const aveSongs = parseNewSongs(cheerio.load(aveHtml), 'Ave.');
    console.log(`  ${aveSongs.length} 首`);
    allSongs.push(...aveSongs);
    
    console.log('爬取 BTA 新曲...');
    const btaHtml = await downloadPage(CONFIG.pages.btaNew,
      path.join(CONFIG.cacheDir, 'bta-new-songs.html'));
    const btaSongs = parseNewSongs(cheerio.load(btaHtml), 'Beyond the Ave.');
    console.log(`  ${btaSongs.length} 首`);
    allSongs.push(...btaSongs);
    
    // 去重
    const seen = new Set();
    allSongs = allSongs.filter(s => {
      const key = `${s.title}-${s.artist}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // 计算 versionHistory
    allSongs = calculateVersionHistory(allSongs);
    
    ensureDir(path.dirname(CONFIG.outputFile));
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(allSongs, null, 2));
    
    console.log(`\n✅ 总计: ${allSongs.length} 首`);
    
    // 验证
    console.log('\n验证前5首:');
    allSongs.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i+1}. ${s.title} / ${s.artist} [${s.genre}]`);
    });
    
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

main();
