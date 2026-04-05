/**
 * 从开源英文词表生成 public/vocab/*.json（无版权释义，仅单词形体；释义可在学习中补全）
 * 运行: node scripts/build-vocab.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../public/vocab');

function cap(w) {
  if (!w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1);
}

async function main() {
  const url = 'https://raw.githubusercontent.com/dwyl/english-words/master/words.txt';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch word list');
  const text = await res.text();
  const pool = text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 4 && w.length <= 14 && /^[a-z]+$/.test(w));

  // 稳定顺序：按字母序，避免每次构建乱跳
  pool.sort((a, b) => a.localeCompare(b));

  const specs = [
    { file: 'coll-1.json', count: 2800, start: 0, prefix: 'c1' },
    { file: 'coll-2.json', count: 1800, start: 2800, prefix: 'c2' },
    { file: 'coll-3.json', count: 5500, start: 4600, prefix: 'c3' },
  ];

  let maxEnd = 0;
  for (const s of specs) maxEnd = Math.max(maxEnd, s.start + s.count);
  if (pool.length < maxEnd) {
    throw new Error(`Word pool too small: need ${maxEnd}, have ${pool.length}`);
  }

  fs.mkdirSync(OUT, { recursive: true });

  for (const s of specs) {
    const slice = pool.slice(s.start, s.start + s.count);
    const json = slice.map((word, i) => ({
      id: `${s.prefix}-${i + 1}`,
      word: cap(word),
      meaning: '',
      phonetic: '',
    }));
    fs.writeFileSync(path.join(OUT, s.file), JSON.stringify(json), 'utf8');
    console.log(`Wrote ${s.file} (${json.length} words)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
