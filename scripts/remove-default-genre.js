/**
 * 移除所有歌曲中默认的 "ポップス" 标签
 *
 * 用法:
 *   node scripts/remove-default-genre.js
 */

const fs = require('fs');

const CONFIG = {
  songsFile: './data/songs.json',
  tsOutputFile: './data/songs.ts',
};

function main() {
  try {
    console.log('[读取] 加载歌曲数据...');
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'));
    console.log(`  现有歌曲: ${songsData.length} 首`);

    // 统计当前的 genre 分布
    const beforeStats = {};
    songsData.forEach(s => {
      const genre = s.genre || '(未设置)';
      beforeStats[genre] = (beforeStats[genre] || 0) + 1;
    });

    console.log('\n移除前的 genre 分布:');
    Object.entries(beforeStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    // 移除默认的 "ポップス" 标签
    let removedCount = 0;
    songsData.forEach((song) => {
      if (song.genre === 'ポップス') {
        delete song.genre;
        removedCount++;
      }
    });

    console.log(`\n移除了 ${removedCount} 首歌曲的默认 "ポップス" 标签`);

    // 统计移除后的 genre 分布
    const afterStats = {};
    songsData.forEach(s => {
      const genre = s.genre || '(未设置)';
      afterStats[genre] = (afterStats[genre] || 0) + 1;
    });

    console.log('\n移除后的 genre 分布:');
    Object.entries(afterStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${k}: ${v}`));

    // 保存结果
    fs.writeFileSync(CONFIG.songsFile, JSON.stringify(songsData, null, 2), 'utf-8');
    console.log(`\n✅ 已保存 JSON: ${CONFIG.songsFile}`);

    // 生成 TypeScript 文件
    const tsContent = `import { Song } from '../lib/types';\n\nexport const songs: Song[] = ${JSON.stringify(songsData, null, 2)};\n`;
    fs.writeFileSync(CONFIG.tsOutputFile, tsContent, 'utf-8');
    console.log(`✅ 已保存 TypeScript: ${CONFIG.tsOutputFile}`);

    // 显示示例
    console.log(`\n示例（现在没有 genre 的歌曲）:`);
    songsData.filter(s => !s.genre).slice(0, 5).forEach(song => {
      console.log(`  - ${song.title}`);
    });

  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
