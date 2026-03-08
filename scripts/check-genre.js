const fs = require('fs');
const songs = JSON.parse(fs.readFileSync('./data/songs.json', 'utf-8'));

// 查找不同 genre 的歌曲
const genres = {};
songs.forEach(s => {
  if (s.genre && s.genre !== 'ポップス') {
    genres[s.genre] = (genres[s.genre] || 0) + 1;
  }
});

console.log('非ポップス的歌曲:');
console.log(genres);

// 查看 firstAppearance 分布
const fa = {};
songs.forEach(s => {
  const key = s.firstAppearance || '未知';
  fa[key] = (fa[key] || 0) + 1;
});

console.log('\nfirstAppearance 分布 (前10):');
Object.entries(fa)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([k, v]) => console.log('  ' + k + ': ' + v));
