/**
 * 将 KyleBing english-vocabulary 的「乱序 .txt」（word\t释义）转为 public/vocab/*.json
 *
 * 默认源目录：english-vocabulary-master/english-vocabulary-master/ 或 english-vocabulary-master/
 *
 * 主表 FILE_MAP：优先 exact 文件名，缺省则 fuzzy 匹配（支持 初中.txt 或 1 初中-乱序.txt）
 * focus-2 <- 雅思538.txt · coll-7 托福 · coll-1 六级 · coll-2 四级 …
 *
 * 补充词表（按文件名优先序，缺则回退旧名）：
 *   coll-9  <- 四级单词官方.txt | 四级单词.txt
 *   coll-10 <- 六级词汇官方.txt | 六级词汇.txt
 *   coll-11 <- 仅 雅思真经.txt（与 538、词根 互不混用）
 *   coll-13 <- 雅思词根.txt（新东方词根版，IELTS 行格式解析）
 *
 * 运行：node scripts/import-vocab-from-txt.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'vocab');

const FILE_MAP = [
  { out: 'focus-2.json', exact: '雅思538.txt', fuzzy: '雅思538' },
  { out: 'coll-7.json', exact: '6 托福-乱序.txt', fuzzy: '托福' },
  { out: 'coll-8.json', exact: '专升本.txt', fuzzy: '专升本' },
  { out: 'coll-1.json', exact: '4 六级-乱序.txt', fuzzy: '六级' },
  { out: 'coll-2.json', exact: '3 四级-乱序.txt', fuzzy: '四级' },
  { out: 'coll-3.json', exact: '5 考研-乱序.txt', fuzzy: '考研' },
  { out: 'coll-4.json', exact: '1 初中-乱序.txt', fuzzy: '初中' },
  { out: 'coll-5.json', exact: '2 高中-乱序.txt', fuzzy: '高中' },
  { out: 'coll-6.json', exact: '7 SAT-乱序.txt', fuzzy: 'SAT' },
];

/** 用户提供的额外 TXT → 独立 JSON，不覆盖上方乱序表 */
const EXTRA_FILE_MAP = [
  { out: 'coll-9.json', candidates: ['四级单词官方.txt', '四级单词.txt'], parser: 'cet4slash' },
  { out: 'coll-10.json', candidates: ['六级词汇官方.txt', '六级词汇.txt'], parser: 'tab' },
  { out: 'coll-11.json', candidates: ['雅思真经.txt'], parser: 'tabOrIelts' },
  { out: 'coll-13.json', candidates: ['雅思词根.txt'], parser: 'ielts' },
];

function findSourceDir() {
  const candidates = [
    path.join(ROOT, 'english-vocabulary-master', 'english-vocabulary-master'),
    path.join(ROOT, 'english-vocabulary-master'),
  ];
  for (const dir of candidates) {
    try {
      const files = fs.readdirSync(dir);
      if (files.some((f) => f.includes('考研') && f.endsWith('.txt'))) return dir;
    } catch {
      /* continue */
    }
  }
  throw new Error(
    '找不到词表文件夹。请将 KyleBing 仓库解压到：糯糯背单词/english-vocabulary-master/...'
  );
}

function resolveInputPath(sourceDir, entry) {
  const direct = path.join(sourceDir, entry.exact);
  if (fs.existsSync(direct)) return direct;
  const all = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.txt'));
  const found = all.find((f) => f.includes(entry.fuzzy));
  return found ? path.join(sourceDir, found) : null;
}

function normalizeWord(raw) {
  const w = raw.trim();
  if (!w) return '';
  if (w.includes(' ')) {
    return w
      .split(/\s+/)
      .map((part) =>
        /^[a-zA-Z\-'.]+$/.test(part)
          ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
          : part
      )
      .join(' ');
  }
  if (/^[a-zA-Z][a-zA-Z\-'.]*$/.test(w)) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }
  return w;
}

function resolveExtraInput(sourceDir, entry) {
  const names =
    entry.candidates ||
    [entry.exact, entry.fallback].filter((x) => typeof x === 'string' && x.length > 0);
  for (const name of names) {
    const p = path.join(sourceDir, name);
    try {
      if (fs.existsSync(p) && fs.statSync(p).size > 0) return p;
    } catch {
      /* continue */
    }
  }
  return null;
}

function parseExtraList(inputPath, idPrefix, parser) {
  if (parser === 'cet4slash') return parseCet4SlashFile(inputPath, idPrefix);
  if (parser === 'ielts') return parseIELTSWordListFile(inputPath, idPrefix);
  if (parser === 'tabOrIelts') {
    const tabbed = parseTxtFile(inputPath, idPrefix);
    if (tabbed.length >= 50) return tabbed;
    const ielts = parseIELTSWordListFile(inputPath, idPrefix);
    return ielts.length > tabbed.length ? ielts : tabbed;
  }
  return parseTxtFile(inputPath, idPrefix);
}

/** 四级单词.txt：左侧为 word/ 形式，\\t 后为音标+释义 */
function parseCet4SlashFile(filePath, idPrefix) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const list = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tab = trimmed.indexOf('\t');
    if (tab === -1) continue;
    const wordRaw = trimmed.slice(0, tab).trim().replace(/\/+$/, '');
    const meaning = trimmed.slice(tab + 1).trim();
    if (!wordRaw || !meaning) continue;
    if (!/^[a-zA-Z.]/.test(wordRaw)) continue;
    list.push({
      id: `${idPrefix}-${list.length + 1}`,
      word: normalizeWord(wordRaw),
      meaning,
      phonetic: '',
    });
  }
  return list;
}

function parseTxtFile(filePath, idPrefix) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const list = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tab = trimmed.indexOf('\t');
    if (tab === -1) continue;
    const wordRaw = trimmed.slice(0, tab).trim();
    const meaning = trimmed.slice(tab + 1).trim();
    if (!wordRaw || !meaning) continue;
    if (!/^[a-zA-Z.]/.test(wordRaw)) continue;
    list.push({
      id: `${idPrefix}-${list.length + 1}`,
      word: normalizeWord(wordRaw),
      meaning,
      phonetic: '',
    });
  }
  return list;
}

function extractPhoneticFromRest(rest) {
  const s = rest.trim();
  const slash = s.match(/^\/[^/]+\//);
  if (slash) return slash[0].slice(1, -1);
  const br = s.match(/^\[[^\]]+\]/);
  if (br) return br[0].slice(1, -1);
  const br2 = s.match(/^\{[^}]+\}/);
  if (br2) return br2[0].slice(1, -1);
  return '';
}

function parseIELTSWordListFile(filePath, idPrefix) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const list = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^Word List\s+\d+/i.test(trimmed)) continue;
    if (
      /^README|^《雅思|^《新东方|^本人不对|^记录在这里|^以 \//.test(trimmed) ||
      /^根据对最后|^范洪滔|^2015-\d{2}-\d{2}/.test(trimmed)
    ) {
      continue;
    }
    if (trimmed.length > 40 && /^[\u4e00-\u9fff\s，。；：]+$/u.test(trimmed)) continue;

    const m = trimmed.match(/^([A-Za-z][A-Za-z\-'/.]*\*?)\s+(.+)$/);
    if (!m) continue;
    const wordRaw = m[1].replace(/\*+$/, '');
    const rest = m[2].trim();
    if (!/^[a-zA-Z.]/.test(wordRaw)) continue;
    const phonetic = extractPhoneticFromRest(rest);
    list.push({
      id: `${idPrefix}-${list.length + 1}`,
      word: normalizeWord(wordRaw),
      meaning: rest,
      phonetic,
    });
  }
  return list;
}

function main() {
  const sourceDir = findSourceDir();
  console.log('源目录:', sourceDir);
  fs.mkdirSync(OUT, { recursive: true });

  const summary = [];

  for (const entry of FILE_MAP) {
    const idPrefix = entry.out.replace('.json', '');
    const input = resolveInputPath(sourceDir, entry);
    if (!input) {
      console.warn('跳过（未找到文件）:', entry.exact);
      summary.push({ out: entry.out, count: 0, skipped: true });
      continue;
    }
    
    const fromName = path.basename(input);
    const list = parseTxtFile(input, idPrefix);

    const outPath = path.join(OUT, entry.out);
    fs.writeFileSync(outPath, JSON.stringify(list), 'utf8');
    console.log(`写入 ${entry.out} <- ${fromName}（${list.length} 词）`);
    summary.push({ out: entry.out, count: list.length, from: fromName });
  }

  for (const entry of EXTRA_FILE_MAP) {
    const idPrefix = entry.out.replace('.json', '');
    const input = resolveExtraInput(sourceDir, entry);
    if (!input) {
      const hint = entry.candidates?.join(' / ') || entry.exact || '';
      console.warn('跳过（未找到非空文件），写入空表:', hint);
      const emptyPath = path.join(OUT, entry.out);
      fs.writeFileSync(emptyPath, JSON.stringify([]), 'utf8');
      summary.push({ out: entry.out, count: 0, skipped: true });
      continue;
    }
    const fromName = path.basename(input);
    const list = parseExtraList(input, idPrefix, entry.parser);
    const outPath = path.join(OUT, entry.out);
    fs.writeFileSync(outPath, JSON.stringify(list), 'utf8');
    console.log(`写入 ${entry.out} <- ${fromName}（${list.length} 词）`);
    summary.push({ out: entry.out, count: list.length, from: fromName });
  }

  console.log('\n完成。npm run dev 后打开词书「查看词表」即可见中文释义。');
  console.log(JSON.stringify(summary, null, 2));
}

main();
