/**
 * 测试脚本：下载 BEMANI Wiki 页面并验证编码
 */

const https = require('https');
const fs = require('fs');
const iconv = require('iconv-lite');

const URL = 'https://bemaniwiki.com/?jubeat%20Ave.%2F%BF%B7%B6%CA%A5%EA%A5%B9%A5%C8';
const OUTPUT = './cache/test-download.html';

console.log('下载页面:', URL);

https.get(URL, { 
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    
    // 尝试 EUC-JP 解码
    const html = iconv.decode(buffer, 'euc-jp');
    
    // 保存
    fs.mkdirSync('./cache', { recursive: true });
    fs.writeFileSync(OUTPUT, html, 'utf-8');
    
    console.log('✅ 下载完成');
    console.log('文件大小:', buffer.length, 'bytes');
    console.log('保存位置:', OUTPUT);
    
    // 检查是否能找到日文
    if (html.includes('一途') || html.includes('jubeat')) {
      console.log('✅ 编码正确，包含日文内容');
    } else {
      console.log('⚠️ 可能编码有问题');
    }
    
    // 显示前 500 字符
    console.log('\n预览 (前 500 字符):');
    console.log(html.replace(/\u003c[^\u003e]*>/g, '').slice(0, 500));
  });
}).on('error', (err) => {
  console.error('❌ 下载失败:', err.message);
});
