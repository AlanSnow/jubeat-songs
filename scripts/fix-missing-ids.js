/**
 * 修复缺失的 atwikiHtmlId
 *
 * 手动添加无法自动匹配的歌曲 ID
 */

const fs = require('fs');

const CONFIG = {
  songsFile: './data/songs.json',
  tsOutputFile: './data/songs.ts',
};

// 手动映射表 - 歌曲名 -> atwikiHtmlId
const manualMappings = {
  '[[GOLD>GOLD(UVERworld)': 1086,
  'ハウトゥワープ': 2460,
  '砂の惑星 feat.初音ミク': 1913,
};

function main() {
  try {
    console.log('[读取] 加载歌曲数据...');
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'));

    console.log(`  现有歌曲: ${songsData.length} 首`);

    // 查找并修复缺失的 ID
    let fixedCount = 0;
    const updatedSongs = songsData.map(song => {
      if (!song.atwikiHtmlId && manualMappings[song.title]) {
        console.log(`  [修复] ${song.title} -> ID: ${manualMappings[song.title]}`);
        fixedCount++;
        return {
          ...song,
          atwikiHtmlId: manualMappings[song.title],
        };
      }
      return song;
    });

    console.log(`\n=== 修复完成 ===`);
    console.log(`修复歌曲数: ${fixedCount} 首`);

    // 检查是否还有未匹配的
    const stillUnmatched = updatedSongs.filter(s => !s.atwikiHtmlId);
    console.log(`仍然未匹配: ${stillUnmatched.length} 首`);

    if (stillUnmatched.length > 0) {
      console.log('\n仍然未匹配的歌曲:');
      stillUnmatched.forEach(s => {
        console.log(`  - [${s.title}] ${s.artist}`);
      });
    }

    // 统计
    const matchedCount = updatedSongs.filter(s => s.atwikiHtmlId).length;
    console.log(`\n有 atwikiHtmlId 的歌曲: ${matchedCount}/${updatedSongs.length}`);

    // 保存 JSON
    fs.writeFileSync(CONFIG.songsFile, JSON.stringify(updatedSongs, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.songsFile}`);

    // 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(updatedSongs, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

    // 显示修复后的示例
    console.log('\n修复后的歌曲:');
    Object.keys(manualMappings).forEach(title => {
      const song = updatedSongs.find(s => s.title === title);
      if (song) {
        console.log(`  - ${song.title} / ${song.artist} -> ID: ${song.atwikiHtmlId}`);
      }
    });

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
