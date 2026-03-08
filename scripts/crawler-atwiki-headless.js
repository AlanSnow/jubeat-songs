/**
 * atwiki 歌曲详情页爬虫 (Playwright Headless)
 *
 * 根据 songs.json 中的 atwikiHtmlId，使用 headless 浏览器拉取歌曲详情页 HTML
 *
 * 用法:
 *   node scripts/crawler-atwiki-headless.js [options]
 *
 * 选项:
 *   --all              拉取所有未缓存的歌曲
 *   --id=123           拉取指定 ID 的歌曲
 *   --range=100-200    拉取 ID 范围内的歌曲
 *   --concurrent=3     并发数（默认：3，建议不要太高）
 *   --delay=2000       请求间隔毫秒（默认：2000）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  // 数据来源
  songsFile: './data/songs.json',
  // 输出目录
  outputDir: './sources/atwiki/pages',
  // 并发数
  concurrent: 3,
  // 请求间隔（毫秒）
  delay: 2000,
  // 重试次数
  maxRetries: 3,
  // 导航超时（毫秒）
  timeout: 60000,
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 下载单个页面
async function downloadPage(browser, id, retryCount = 0) {
  const url = `https://w.atwiki.jp/jubeat/pages/${id}.html`;
  const outputFile = path.join(CONFIG.outputDir, `${id}.html`);

  // 如果文件已存在且大小大于0，跳过
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    if (stats.size > 1000) { // 至少1KB才算有效
      console.log(`  [SKIP] ID ${id} - 已存在`);
      return { id, success: true, cached: true };
    }
  }

  console.log(`  [DOWNLOAD] ID ${id} - ${url}`);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // 设置超时
    page.setDefaultTimeout(CONFIG.timeout);

    // 访问页面
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout,
    });

    // 检查响应状态
    if (!response) {
      throw new Error('No response received');
    }

    if (response.status() === 404) {
      throw new Error('Page not found (404)');
    }

    if (response.status() !== 200) {
      throw new Error(`HTTP ${response.status()}`);
    }

    // 检查是否是错误页面
    const title = await page.title().catch(() => '');
    if (title.includes('404') || title.includes('Not Found') || title.includes('見つかりません')) {
      throw new Error('Page not found (title check)');
    }

    // 等待页面内容加载
    await page.waitForLoadState('domcontentloaded');

    // 获取页面 HTML
    const html = await page.content();

    // 检查内容是否有效
    if (html.includes('ページが見つかりません') ||
        html.includes('このページは存在しません') ||
        html.length < 1000) {
      throw new Error('Invalid page content');
    }

    // 保存文件
    ensureDir(CONFIG.outputDir);
    fs.writeFileSync(outputFile, html, 'utf-8');

    console.log(`  [SUCCESS] ID ${id} - 已保存 (${(html.length / 1024).toFixed(1)}KB)`);
    return { id, success: true, cached: false, size: html.length };

  } catch (err) {
    console.error(`  [ERROR] ID ${id} - ${err.message}`);

    // 重试逻辑
    if (retryCount < CONFIG.maxRetries) {
      console.log(`    [RETRY] ID ${id} - 第 ${retryCount + 1} 次重试...`);
      await sleep(CONFIG.delay * 2);
      return downloadPage(browser, id, retryCount + 1);
    }

    return { id, success: false, error: err.message };

  } finally {
    await context.close();
  }
}

// 批量下载（控制并发）
async function batchDownload(browser, ids, concurrent = CONFIG.concurrent) {
  const results = [];
  const queue = [...ids];
  const executing = new Set();

  async function processNext() {
    if (queue.length === 0) return;

    const id = queue.shift();
    const promise = downloadPage(browser, id).then(result => {
      executing.delete(promise);
      return result;
    });

    results.push(promise);
    executing.add(promise);

    if (executing.size >= concurrent) {
      await Promise.race(executing);
    }

    // 请求间隔
    if (queue.length > 0) {
      await sleep(CONFIG.delay);
    }

    // 继续处理下一个
    await processNext();
  }

  // 启动多个并发处理
  const workers = Array(Math.min(concurrent, ids.length))
    .fill()
    .map(() => processNext());

  await Promise.all(workers);
  return Promise.all(results);
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    ids: [],
    concurrent: CONFIG.concurrent,
    delay: CONFIG.delay,
  };

  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--id=')) {
      options.ids.push(parseInt(arg.split('=')[1], 10));
    } else if (arg.startsWith('--range=')) {
      const [start, end] = arg.split('=')[1].split('-').map(Number);
      for (let i = start; i <= end; i++) {
        options.ids.push(i);
      }
    } else if (arg.startsWith('--concurrent=')) {
      options.concurrent = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--delay=')) {
      options.delay = parseInt(arg.split('=')[1], 10);
    }
  }

  return options;
}

// 主函数
async function main() {
  let browser;

  try {
    const options = parseArgs();

    // 1. 读取 songs.json 获取所有 atwikiHtmlId
    console.log('[读取] 加载歌曲数据...');
    const songsData = JSON.parse(fs.readFileSync(CONFIG.songsFile, 'utf-8'));

    // 提取所有有效的 atwikiHtmlId
    const allIds = songsData
      .map(s => s.atwikiHtmlId)
      .filter(id => id && typeof id === 'number')
      .sort((a, b) => a - b);

    // 去重
    const uniqueIds = [...new Set(allIds)];
    console.log(`  共有 ${uniqueIds.length} 个唯一的 atwikiHtmlId`);

    // 2. 确定要下载的 ID 列表
    let targetIds = [];

    if (options.ids.length > 0) {
      // 使用命令行指定的 ID
      targetIds = options.ids.filter(id => uniqueIds.includes(id));
      console.log(`\n[模式] 指定 ID 模式 - ${targetIds.length} 个`);
    } else if (options.all) {
      // 下载所有未缓存的
      targetIds = uniqueIds.filter(id => {
        const filePath = path.join(CONFIG.outputDir, `${id}.html`);
        return !fs.existsSync(filePath) || fs.statSync(filePath).size < 1000;
      });
      console.log(`\n[模式] 全量模式 - ${targetIds.length} 个未缓存`);
    } else {
      // 默认：显示帮助
      console.log(`
用法: node scripts/crawler-atwiki-headless.js [options]

选项:
  --all              拉取所有未缓存的歌曲详情页
  --id=123           拉取指定 ID 的歌曲
  --range=100-200    拉取 ID 范围内的歌曲
  --concurrent=3     并发数（默认：3，建议不要太高）
  --delay=2000       请求间隔毫秒（默认：2000）

示例:
  node scripts/crawler-atwiki-headless.js --all
  node scripts/crawler-atwiki-headless.js --id=103
  node scripts/crawler-atwiki-headless.js --range=100-200 --concurrent=2
      `);
      return;
    }

    if (targetIds.length === 0) {
      console.log('\n✅ 所有歌曲详情页已缓存，无需下载');
      return;
    }

    console.log(`\n[下载] 开始下载 ${targetIds.length} 个页面...`);
    console.log(`  并发数: ${options.concurrent}`);
    console.log(`  间隔: ${options.delay}ms`);

    // 3. 启动浏览器
    console.log('\n[启动] 正在启动 headless 浏览器...');
    browser = await chromium.launch({
      headless: true,
      slowMo: 100, // 稍微放慢操作，避免被检测
    });
    console.log('  浏览器已启动');

    // 4. 批量下载
    const startTime = Date.now();
    const results = await batchDownload(browser, targetIds, options.concurrent);
    const duration = (Date.now() - startTime) / 1000;

    // 5. 统计结果
    const successCount = results.filter(r => r.success).length;
    const cachedCount = results.filter(r => r.cached).length;
    const downloadedCount = results.filter(r => r.success && !r.cached).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`\n=== 下载完成 ===`);
    console.log(`总计: ${results.length} 个`);
    console.log(`  - 成功: ${successCount} 个`);
    console.log(`    - 新下载: ${downloadedCount} 个`);
    console.log(`    - 已缓存: ${cachedCount} 个`);
    console.log(`  - 失败: ${failedCount} 个`);
    console.log(`耗时: ${duration.toFixed(1)} 秒`);

    if (downloadedCount > 0) {
      const totalSize = results
        .filter(r => r.success && !r.cached && r.size)
        .reduce((sum, r) => sum + r.size, 0);
      console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }

    // 6. 显示失败的 ID
    if (failedCount > 0) {
      const failedIds = results.filter(r => !r.success).map(r => r.id);
      console.log(`\n失败的 ID: ${failedIds.join(', ')}`);
    }

    // 7. 检查已缓存的文件总数
    const cachedFiles = fs.readdirSync(CONFIG.outputDir)
      .filter(f => f.endsWith('.html'))
      .length;
    console.log(`\n📁 缓存文件总数: ${cachedFiles} 个`);

  } catch (err) {
    console.error('\n❌ 错误:', err.message);
    console.error(err.stack);
    process.exit(1);

  } finally {
    // 8. 关闭浏览器
    if (browser) {
      console.log('\n[关闭] 正在关闭浏览器...');
      await browser.close();
      console.log('  浏览器已关闭');
    }
  }
}

main();
