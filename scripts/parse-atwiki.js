/**
 * Parse atwiki HTML files and extract jubeat song data
 * Outputs to data_new/ directory
 * Uses native Node.js (no external dependencies)
 */

const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = './data_new';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// atwiki HTML files to parse
const htmlFiles = [
  { file: '曲リスト(Ave._旧曲).html', version: 'Ave.', isOld: true },
  { file: '曲リスト(Ave._新曲).html', version: 'Ave.', isNew: true },
  { file: '曲リスト(b_Ave._旧曲).html', version: 'Beyond the Ave.', isOld: true },
  { file: '曲リスト(b_Ave._新曲).html', version: 'Beyond the Ave.', isNew: true },
  { file: '曲リスト(festo).html', version: 'festo' }, // Contains both old and new songs with time period separators
  // Older versions (festo format with version separators)
  { file: '曲リスト(clan).html', version: 'clan' },
  { file: '曲リスト(qubell).html', version: 'Qubell' },
  { file: '曲リスト(prop).html', version: 'prop' },
  { file: '曲リスト(saucer fulfill).html', version: 'saucer fulfill' },
  { file: '曲リスト(saucer).html', version: 'saucer' },
  { file: '曲リスト(copious).html', version: 'copious' },
  { file: '曲リスト(knit).html', version: 'knit' },
  { file: '曲リスト(ripples).html', version: 'ripples' },
  { file: '曲リスト(jubeat初代).html', version: 'jubeat' },
];

// TODO：新曲旧曲都在一个 HTML 的特殊情况，需要特殊处理
const festoHtmlFile = { file: '曲リスト(festo).html', version: 'festo' };

// HTML entities decoder
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Clean text - remove extra whitespace
function cleanText(text) {
  if (!text) return '';
  return decodeHtmlEntities(text)
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract text from HTML tag
function extractTextFromTag(html) {
  // Remove tags
  const text = html.replace(/<[^>]+>/g, ' ');
  return cleanText(text);
}

// Extract song title - handles <a> tags and suffixes like [2], [3]
function extractTitle(html) {
  // Try to extract from <a> tag first
  const linkMatch = html.match(/<a[^>]*>(.*?)<\/a>/i);
  if (linkMatch) {
    const linkText = cleanText(linkMatch[1].replace(/<[^>]+>/g, ''));
    // Check for suffixes like [2], [3] after the </a> tag
    const afterLink = html.substring(linkMatch.index + linkMatch[0].length);
    const suffixMatch = afterLink.match(/(\s*\[\d+\]\s*)/);
    if (suffixMatch) {
      return linkText + suffixMatch[1].trim();
    }
    return linkText;
  }
  return extractTextFromTag(html);
}

// Parse a table row into cells
function parseTableRow(rowHtml) {
  const cells = [];
  // Match <td> or <th> tags - use [\s\S] to match across newlines
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let match;
  while ((match = cellRegex.exec(rowHtml)) !== null) {
    cells.push(match[1]);
  }
  return cells;
}

// Check if a row is a separator/header row
function isSeparatorRow(cells) {
  if (cells.length === 0) return true;
  const firstCell = cleanText(cells[0]);
  return firstCell.includes('jubeat') ||
         firstCell.includes('ホールド') ||
         firstCell.includes('color') ||
         cells.length < 9;
}

// Parse a single song row
// firstAppearance: version from table separator (e.g., 'jubeat')
// fileVersion: version of the file being parsed (e.g., 'clan', 'festo')
function parseSongRow(rowHtml, firstAppearance, fileVersion) {
  // Clean up row - remove tbody/thead tags
  const cleanRow = rowHtml.replace(/<\/?(tbody|thead)[^>]*>/gi, '').trim();

  const cells = parseTableRow(cleanRow);

  // Need at least 9 cells (up to 11 with release date and extra)
  if (cells.length < 9) return null;

  // Skip separator/header rows - use extracted title, not raw HTML
  const firstCellText = extractTextFromTag(cells[0]);
  if (firstCellText.includes('ホールド') ||
      firstCellText.includes('color') ||
      cells[0].includes('<th')) {
    return null;
  }

  try {
    // Extract data from cells
    const title = extractTitle(cells[0]);
    const artist = extractTextFromTag(cells[1]);
    const bpmText = extractTextFromTag(cells[2]);
    const bscLevel = extractTextFromTag(cells[3]);
    const advLevel = extractTextFromTag(cells[4]);
    const extLevel = extractTextFromTag(cells[5]);
    const bscNotes = extractTextFromTag(cells[6]);
    const advNotes = extractTextFromTag(cells[7]);
    const extNotes = extractTextFromTag(cells[8]);
    const releaseDate = cells.length > 9 ? extractTextFromTag(cells[9]) : '';

    // Skip if no title or no extreme level
    if (!title || !extLevel || extLevel === '0') return null;

    // Parse numeric values
    const parseLevel = (text) => {
      const match = text.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const parseNotes = (text) => {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const parseBpm = (text) => {
      // Handle ranges like "120-160"
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    // Generate ID
    const id = `jbt-${title.replace(/[^\w]/g, '').slice(0, 15)}-${Math.random().toString(36).slice(2, 6)}`;

    // Determine if it's a license song
    const isLicense = !artist.includes('BEMANI Sound Team') &&
                      !artist.includes('Yoshihiro Tagawa') &&
                      !artist.includes('Tatsuya Iyama') &&
                      !artist.includes('Takayuki Ishikawa') &&
                      !artist.includes('Yoshitaka Nishimura');

    const song = {
      id,
      title,
      artist,
      bpm: parseBpm(bpmText),
      genre: 'ポップス', // Default genre - can be refined later
      difficulties: {
        basic: {
          level: parseLevel(bscLevel),
          notes: parseNotes(bscNotes)
        },
        advanced: {
          level: parseLevel(advLevel),
          notes: parseNotes(advNotes)
        },
        extreme: {
          level: parseLevel(extLevel),
          notes: parseNotes(extNotes)
        }
      },
      firstAppearance: firstAppearance,
      releaseDate: releaseDate || '',
      deletedDate: '',
      deletedIn: '',
      isLicense,
    };

    // Add BPM range only if present
    if (bpmText.includes('-')) {
      song.bpmRange = bpmText;
    }

    // Track source (file version) for building version history (will be removed later)
    // This records which file the song was found in
    song.source = fileVersion;

    return song;
  } catch (e) {
    console.error('Error parsing row:', e.message);
    return null;
  }
}

// Extract version from a separator row
function extractVersionFromRow(rowHtml, defaultVersion) {
  // Match version separator like: <td colspan="10">jubeat</td> or <td style="..." colspan="11">knit</td>
  // Some older versions use colspan="11" instead of colspan="10"
  const versionMatch = rowHtml.match(/<td[^>]*colspan=["']?(10|11)["']?[^>]*>([^<]+)</i);
  if (versionMatch) {
    let version = versionMatch[2].trim();

    // For festo HTML, the separators are time periods, not versions
    // All festo songs should have firstAppearance = "festo"
    if (defaultVersion === 'festo') {
      // Check if it's a time period header (contains dates like 2018/09, 2019/01, etc.)
      if (version.match(/\d{4}\/\d{2}/) ||
          version.includes('共通') ||
          version.includes('T-emo') ||
          version.includes('第') ||
          version.includes('Track') ||
          version.includes('編') ||
          version.includes('memories') ||
          version.includes('SELECTION') ||
          version.includes('ラッシュ') ||
          version.includes('メドレー') ||
          version.includes('DISC TELLER') ||
          version.includes('Party goes on') ||
          version.includes('新曲') ||
          version.includes('common') ||
          version.includes('pick up')) {
        // Return default version (festo) for time period headers
        return defaultVersion;
      }
    }

    // For older versions, check if the separator contains a version name in parentheses
    // e.g., "伝導解禁曲(jubeat)", "伝導解禁曲(knit)"
    const parenMatch = version.match(/\(([^)]+)\)/);
    if (parenMatch) {
      const innerVersion = parenMatch[1].trim();
      const knownVersions = ['jubeat', 'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.'];
      if (knownVersions.includes(innerVersion)) {
        return innerVersion;
      }
    }

    // Only return known version names
    const knownVersions = ['jubeat', 'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.'];
    if (knownVersions.includes(version)) {
      return version;
    }
  }
  return null;
}

// Check if a row is a version separator
function isVersionSeparator(rowHtml, defaultVersion) {
  return (rowHtml.includes('colspan="10"') || rowHtml.includes('colspan="11"')) && extractVersionFromRow(rowHtml, defaultVersion) !== null;
}

// Find and parse song tables in HTML
function parseSongTables(html, defaultVersion) {
  const songs = [];

  // Find all tables
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableContent = tableMatch[1];

    // Check if this is a song table
    if (!tableContent.includes('BSC') || !tableContent.includes('ADV') || !tableContent.includes('EXT')) {
      continue;
    }

    console.log(`  Found song table`);

    // Check if this is festo format (has colspan="10" or colspan="11" version separators)
    // festo format: version separators with colspan="10" or "11", no header rows
    // Ave. format: <thead> with headers, need to skip first 2 data rows
    const isFestoFormat = tableContent.includes('colspan="10"') || tableContent.includes("colspan='10'") ||
                          tableContent.includes('colspan="11"') || tableContent.includes("colspan='11'");

    // Split table content by </tr> to get rows (more reliable than regex for nested content)
    const rowParts = tableContent.split(/<\/tr>/i);
    let rowCount = 0;
    let songCount = 0;
    let currentVersion = defaultVersion; // Track version from separator rows
    let rowsSinceVersionSeparator = 999; // Track rows since last version separator

    for (const rowPart of rowParts) {
      // Skip empty rows
      const trimmed = rowPart.trim();
      if (!trimmed || !trimmed.includes('<td')) continue;

      // Check if this is a version separator row FIRST
      // Match colspan="10" or "11" anywhere in the td tag, then capture the text content
      const versionSeparatorMatch = trimmed.match(/<td[^>]*colspan=["']?(10|11)["']?[^>]*>([^<]+)</i);
      if (versionSeparatorMatch) {
        const detectedVersion = extractVersionFromRow(trimmed, defaultVersion);
        if (detectedVersion) {
          currentVersion = detectedVersion;
          rowsSinceVersionSeparator = 0; // Reset counter after version separator
          console.log(`    → Version: ${currentVersion}`);
          continue; // Skip this row as it's a separator
        }
      }

      // Try to parse as a song row first
      // Pass both the currentVersion (from table separator) and defaultVersion (file version)
      const fullRow = trimmed + '</tr>';
      const song = parseSongRow(fullRow, currentVersion, defaultVersion);

      if (song) {
        rowCount++;
        rowsSinceVersionSeparator++;

        // Skip first 2 data rows in Ave. format (header rows)
        // festo format has version separators and doesn't have header rows to skip
        if (!isFestoFormat && rowCount <= 2) continue;

        songs.push(song);
        songCount++;
      }
    }

    console.log(`    Parsed ${songCount} songs from ${rowCount - 2} data rows`);
  }

  return songs;
}

// Parse a single HTML file
function parseHtmlFile(filePath, versionInfo) {
  console.log(`\nParsing: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }

  const html = fs.readFileSync(filePath, 'utf-8');
  return parseSongTables(html, versionInfo.version);
}

// Main function
async function main() {
  console.log('=== jubeat atwiki Parser ===\n');

  let allSongs = [];

  // Parse each HTML file
  for (const { file, version } of htmlFiles) {
    const filePath = path.join('./atwiki', file);
    const songs = parseHtmlFile(filePath, { version });
    allSongs.push(...songs);
  }

  console.log(`\n=== Total songs parsed: ${allSongs.length} ===`);

  // Remove duplicates based on title + artist
  // Keep the song with the earliest firstAppearance (original version)
  const seen = new Map(); // key -> { song, index }
  const uniqueSongs = [];
  let duplicates = 0;

  // Define version order (earliest first)
  const versionOrder = ['jubeat', 'ripples', 'knit', 'copious', 'saucer', 'saucer fulfill', 'prop', 'Qubell', 'clan', 'festo', 'Ave.', 'Beyond the Ave.'];
  const versionRank = Object.fromEntries(versionOrder.map((v, i) => [v, i]));

  for (const song of allSongs) {
    const key = `${song.title}-${song.artist}`;
    if (seen.has(key)) {
      duplicates++;
      // Check if current song has an earlier firstAppearance
      const existing = seen.get(key);
      const existingRank = versionRank[existing.song.firstAppearance] ?? 999;
      const currentRank = versionRank[song.firstAppearance] ?? 999;

      if (currentRank < existingRank) {
        // Replace with earlier version
        uniqueSongs[existing.index] = song;
        existing.song = song;
      }
      continue;
    }
    seen.set(key, { song, index: uniqueSongs.length });
    uniqueSongs.push(song);
  }

  console.log(`Removed ${duplicates} duplicates`);
  console.log(`Unique songs: ${uniqueSongs.length}`);

  // Build version history
  const versionHistoryMap = new Map();

  // Track which versions each song appeared in
  // Add both firstAppearance (from table version headers) and source version (from file)
  // This ensures we capture: 1) the original version, and 2) all versions where the song exists
  for (const song of allSongs) {
    const key = `${song.title}-${song.artist}`;
    if (!versionHistoryMap.has(key)) {
      versionHistoryMap.set(key, new Set());
    }
    // Add the firstAppearance (e.g., jubeat for Evans)
    if (song.firstAppearance) {
      versionHistoryMap.get(key).add(song.firstAppearance);
    }
    // Also add the source version (the file's version, e.g., clan, festo, etc.)
    // This ensures songs are marked as existing in all subsequent versions
    if (song.source && song.source !== song.firstAppearance) {
      versionHistoryMap.get(key).add(song.source);
    }
  }

  // Assign version history to unique songs
  for (const song of uniqueSongs) {
    const key = `${song.title}-${song.artist}`;
    const versions = versionHistoryMap.get(key);
    if (versions) {
      song.versionHistory = Array.from(versions);
    }
  }

  // Sort songs by title
  uniqueSongs.sort((a, b) => a.title.localeCompare(b.title, 'ja'));

  // Remove internal 'source' field from output
  for (const song of uniqueSongs) {
    delete song.source;
  }

  // Generate TypeScript file
  const tsContent = `import { Song } from '../lib/types';

export const songs: Song[] = ${JSON.stringify(uniqueSongs, null, 2)};

export const allGenres = [
  '全部',
  'ポップス',
  'アニメ',
  '東方アレンジ',
  'バラエティ',
  'ナムコオリジナル',
  'コナミオリジナル',
];
`;

  fs.writeFileSync(path.join(outputDir, 'songs.ts'), tsContent, 'utf-8');
  console.log(`\n✅ Saved TypeScript file: ${path.join(outputDir, 'songs.ts')}`);

  // Also save as JSON
  fs.writeFileSync(path.join(outputDir, 'songs.json'), JSON.stringify(uniqueSongs, null, 2), 'utf-8');
  console.log(`✅ Saved JSON file: ${path.join(outputDir, 'songs.json')}`);

  // Statistics
  console.log('\n=== Statistics ===');

  const versionCounts = {};
  for (const song of uniqueSongs) {
    const v = song.firstAppearance || 'Unknown';
    versionCounts[v] = (versionCounts[v] || 0) + 1;
  }
  console.log('By version:', versionCounts);

  const levelCounts = {};
  for (const song of uniqueSongs) {
    const lv = Math.floor(song.difficulties.extreme.level);
    if (lv >= 1 && lv <= 10) {
      levelCounts[lv] = (levelCounts[lv] || 0) + 1;
    }
  }
  console.log('By EXT level:', levelCounts);

  const licenseCount = uniqueSongs.filter(s => s.isLicense).length;
  console.log(`License songs: ${licenseCount}`);
  console.log(`Original songs: ${uniqueSongs.length - licenseCount}`);

  // Show sample songs
  console.log('\n=== Sample Songs ===');
  uniqueSongs.slice(0, 3).forEach((song, i) => {
    console.log(`${i + 1}. ${song.title}`);
    console.log(`   Artist: ${song.artist}`);
    console.log(`   EXT: Lv.${song.difficulties.extreme.level} / ${song.difficulties.extreme.notes}notes`);
    console.log(`   Version: ${song.firstAppearance}`);
    console.log(`   Version History: ${song.versionHistory?.join(', ')}`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
