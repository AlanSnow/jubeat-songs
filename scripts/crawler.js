/**
 * BEMANI Wiki jubeat 曲目爬虫
 * 开发阶段：先下载 HTML 到本地，再解析
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

// 配置
const CONFIG = {
  // 开发模式：true = 使用本地缓存，false = 重新下载
  devMode: true,
  // 缓存目录
  cacheDir: './cache',
  // 输出文件
  outputFile: './data/songs-full.json',
  // Wiki 页面 URL
  pages: {
    newSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8', // 新曲リスト
    oldSongs: 'https://bemaniwiki.com/?jubeat%20Ave.%2F%B5%EC%B6%CA%A5%EA%A5%B9%A5%C8', // 旧曲リスト
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 下载页面（处理 EUC-JP 编码）
async function downloadPage(url, cacheFile) {
  // 如果缓存存在且开发模式开启，直接读取缓存
  if (CONFIG.devMode && fs.existsSync(cacheFile)) {
    console.log(`[CACHE] 读取缓存: ${cacheFile}`);
    return fs.readFileSync(cacheFile, 'utf-8');
  }

  console.log(`[DOWNLOAD] 下载: ${url}`);
  
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    options.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    https.get(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        // BEMANI Wiki 使用 EUC-JP 编码
        const buffer = Buffer.concat(chunks);
        const html = iconv.decode(buffer, 'euc-jp');
        
        // 保存缓存
        ensureDir(path.dirname(cacheFile));
        fs.writeFileSync(cacheFile, html, 'utf-8');
        console.log(`[SAVED] 已保存: ${cacheFile}`);
        
        resolve(html);
      });
    }).on('error', reject);
  });
}

// 解析单个歌曲行
function parseSongRow($, cells, hasCategory) {
  try {
    // 列索引映射
    // 有分类: 0=分类, 1=曲名, 2=艺术家, 3=BPM, 4=BSC Lv, 5=BSC Note, 6=ADV Lv, 7=ADV Note, 8=EXT Lv, 9=EXT Note
    // 无分类: 0=曲名, 1=艺术家, 2=BPM, 3=BSC Lv, 4=BSC Note, 5=ADV Lv, 6=ADV Note, 7=EXT Lv, 8=EXT Note
    
    let idx = 0;
    
    // 判断是否有分类列
    const category = hasCategory ? $(cells[idx++]).text().trim() : '';
    
    // 无论是否有分类，现在 idx 都指向曲名列
    const title = $(cells[idx++]).text().trim();
    const artist = $(cells[idx++]).text().trim();
    const bpmText = $(cells[idx++]).text().trim();
    const bpm = parseInt(bpmText) || 0;
    
    // 难度数据 - Lv 列
    const basicLv = $(cells[idx++]).text().trim();
    const basicNotes = $(cells[idx++]).text().trim(); // 跳过 Note 列
    const advLv = $(cells[idx++]).text().trim();
    const advNotes = $(cells[idx++]).text().trim(); // 跳过 Note 列
    const extLv = $(cells[idx++]).text().trim();
    const extNotes = $(cells[idx++]).text().trim(); // Note 列
    
    // 清理 notes 中的括号内容 (XXX)
    const cleanNotes = (text) => {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    // 清理 level (可能有小数如 9.4)
    const cleanLevel = (text) => {
      const match = text.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };
    
    const song = {
      id: '',
      title,
      artist,
      bpm,
      genre: mapCategory(category),
      difficulties: {
        basic: {
          level: cleanLevel(basicLv),
          notes: cleanNotes(basicNotes)
        },
        advanced: {
          level: cleanLevel(advLv),
          notes: cleanNotes(advNotes)
        },
        extreme: {
          level: cleanLevel(extLv),
          notes: cleanNotes(extNotes)
        }
      },
      version: 'Ave.',
      isLicense: !artist.includes('BEMANI Sound Team')
    };
    
    // 生成 ID
    song.id = `ave-${song.title.replace(/[^\w]/g, '').slice(0, 20)}`;
    
    return song;
  } catch (e) {
    console.error('解析行失败:', e.message);
    return null;
  }
}

// 分类映射
function mapCategory(category) {
  const map = {
    'アニメ': 'アニメ',
    'ポップス': 'ポップス',
    'アニメポップス': 'アニメ',
    'ソーシャル': 'ポップス',
    '東方アレンジ': '東方アレンジ',
    'バラエティ': 'バラエティ',
  };
  
  // 清理 category 中的换行
  const clean = category.replace(/\n/g, '');
  return map[clean] || 'ポップス';
}

// 解析页面中的所有歌曲表格
function parsePage($) {
  const songs = [];
  
  $('table.style_table').each((i, table) => {
    const $table = $(table);
    
    // 检查表头判断表格类型
    const headerText = $table.find('thead').text() || $table.find('tr:first').text();
    
    // 检查是否有「カテゴリ」列
    const hasCategory = headerText.includes('カテゴリ');
    
    // 检查是否为难度表（包含 BSC/ADV/EXT）
    const isDifficultyTable = headerText.includes('BSC') && headerText.includes('ADV');
    
    if (!isDifficultyTable) {
      return; // 跳过非难度表
    }
    
    console.log(`  发现表格 #${i} (${hasCategory ? '有分类' : '无分类'})`);
    
    // 遍历数据行（跳过表头行）
    const rows = $table.find('tr');
    let songCount = 0;
    
    rows.each((j, row) => {
      // 跳过表头行和合并行
      if (j === 0 || j === 1) return;
      
      const cells = $(row).find('td');
      const cellCount = cells.length;
      
      // 根据是否有分类列判断
      const expectedCells = hasCategory ? 10 : 9;
      
      if (cellCount >= expectedCells - 1) { // 允许一点容错
        const song = parseSongRow($, cells, hasCategory);
        
        if (song && song.title && song.difficulties.extreme.level > 0) {
          songs.push(song);
          songCount++;
        }
      }
    });
    
    console.log(`    解析到 ${songCount} 首歌曲`);
  });
  
  return songs;
}

// 主函数
async function main() {
  try {
    ensureDir(CONFIG.cacheDir);
    
    let allSongs = [];
    
    // 1. 下载/读取新曲列表
    console.log('\n=== 新曲リスト ===');
    const newSongsHtml = await downloadPage(
      CONFIG.pages.newSongs,
      path.join(CONFIG.cacheDir, 'new-songs.html')
    );
    const $new = cheerio.load(newSongsHtml);
    const newSongs = parsePage($new);
    console.log(`新曲总计: ${newSongs.length} 首`);
    allSongs.push(...newSongs);
    
    // 2. 下载/读取旧曲列表（如果需要）
    console.log('\n=== 旧曲リスト ===');
    const oldSongsHtml = await downloadPage(
      CONFIG.pages.oldSongs,
      path.join(CONFIG.cacheDir, 'old-songs.html')
    );
    const $old = cheerio.load(oldSongsHtml);
    const oldSongs = parsePage($old);
    console.log(`旧曲总计: ${oldSongs.length} 首`);
    allSongs.push(...oldSongs);
    
    // 3. 去重（按标题+艺术家）
    const seen = new Set();
    allSongs = allSongs.filter(song => {
      const key = `${song.title}-${song.artist}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // 4. 保存
    ensureDir(path.dirname(CONFIG.outputFile));
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(allSongs, null, 2), 'utf-8');
    
    console.log(`\n✅ 完成！`);
    console.log(`总计: ${allSongs.length} 首`);
    console.log(`输出: ${CONFIG.outputFile}`);
    
    // 5. 统计
    const stats = {
      total: allSongs.length,
      license: allSongs.filter(s => s.isLicense).length,
      original: allSongs.filter(s => !s.isLicense).length,
      level10: allSongs.filter(s => s.difficulties.extreme.level >= 10).length,
    };
    
    console.log('\n📊 统计:');
    console.log(`  - 版权曲: ${stats.license}`);
    console.log(`  - 原创曲: ${stats.original}`);
    console.log(`  - Lv.10+: ${stats.level10}`);
    
    // 6. 显示前 5 首作为示例
    console.log('\n🎵 示例数据（前5首）:');
    allSongs.slice(0, 5).forEach((song, i) => {
      console.log(`  ${i+1}. ${song.title} - ${song.artist}`);
      console.log(`     EXT: Lv.${song.difficulties.extreme.level} / ${song.difficulties.extreme.notes}notes`);
    });
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行
main();
