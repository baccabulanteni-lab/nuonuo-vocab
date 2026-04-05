/**
 * 本地解析词表文本，不调用任何网络 API。
 * 支持：每行一词、word - 释义、word\t释义、word 中文释义（空格分隔）等常见格式。
 */

import {
  parseCustomTxtContent,
  stripVocabLineIndex,
  sanitizeWordToken,
  peelLeadingPhonetic,
} from './txtParser';

export type ParsedVocabItem = {
  word: string;
  meaning: string;
  phonetic: string;
};

const MAX_WORDS = 8000;
const MAX_WORD_CHARS = 72;

function capitalizeWord(w: string): string {
  if (!w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

/** 从一行中取首个英文词（用于 tab 左侧等） */
function firstEnglishToken(s: string): string | null {
  const m = s.trim().match(/^([a-zA-Z][a-zA-Z\-']*)/);
  return m ? m[1] : null;
}

/**
 * @param raw 用户粘贴或文件全文
 */
export function parseVocabTextToWords(raw: string): ParsedVocabItem[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => stripVocabLineIndex(l.trim()))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: ParsedVocabItem[] = [];

  const push = (word: string, meaning: string) => {
    const w = sanitizeWordToken(word);
    if (!w || !/^[a-zA-Z]/.test(w) || w.length > MAX_WORD_CHARS) return;
    const key = w.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const peeled = peelLeadingPhonetic(meaning.trim());
    out.push({
      word: capitalizeWord(w),
      meaning: peeled.rest || meaning.trim() || '',
      phonetic: peeled.phonetic,
    });
  };

  for (const line of lines) {
    if (out.length >= MAX_WORDS) break;

    const tabParts = line.split(/\t+/);
    if (tabParts.length >= 2) {
      const w = firstEnglishToken(tabParts[0]) || tabParts[0].trim();
      const meaning = tabParts.slice(1).join(' ').trim();
      if (w && /^[a-zA-Z]/.test(w)) {
        push(w, meaning);
      }
      continue;
    }

    const dash = line.match(
      /^([a-zA-Z][a-zA-Z\-']{0,48})\s*[-–—:|：]\s*(.+)$/
    );
    if (dash) {
      push(dash[1].trim(), dash[2].trim());
      continue;
    }

    const cn = line.match(
      /^([a-zA-Z][a-zA-Z\-']{0,48})\s+([\u4e00-\u9fff\u3000-\u303f\uff00-\uffef].+)$/
    );
    if (cn) {
      push(cn[1].trim(), cn[2].trim());
      continue;
    }

    const only = line.match(/^([a-zA-Z][a-zA-Z\-']{1,48})$/);
    if (only) {
      push(only[1], '');
      continue;
    }

    // (Removed aggressive line.split() tokenization that incorrectly swept up random English words in sentences)
  }

  return out;
}

export type UnifiedImportResult = {
  items: ParsedVocabItem[];
  totalLines: number;
  skippedCount: number;
  skippedSamples: string[];
  /** 结构化解析成功写入的条数（与 items 接近；去重模式下可能小于 items） */
  structuredRowCount: number;
};

export type UnifiedImportOptions = {
  /**
   * true：同一英文词只保留一条（取长释义）。false：保留文件中的每一行，允许重复单词（乱序/多单元重复常见）。
   * 默认 false，与「行数≈词数」的教材词表一致。
   */
  dedupeByWord?: boolean;
};

function structuredRowToItem(row: {
  word: string;
  meaning: string;
  phonetic?: string;
}): ParsedVocabItem {
  const meaning = (row.meaning && row.meaning !== '未提供释义' ? row.meaning : '').trim();
  return {
    word: row.word,
    meaning: meaning || '未提供释义',
    phonetic: row.phonetic || '',
  };
}

/**
 * 合并「结构化行解析」与「宽松行解析」。
 * 默认不按单词去重，避免 3000+ 行因重复词被压成 ~2000 条。
 */
export function parseImportedVocabularyUnified(
  raw: string,
  options?: UnifiedImportOptions
): UnifiedImportResult {
  const dedupeByWord = options?.dedupeByWord === true;
  const structured = parseCustomTxtContent(raw, 'u');
  const structuredRowCount = structured.list.length;

  let items: ParsedVocabItem[];

  if (dedupeByWord) {
    const map = new Map<string, ParsedVocabItem>();
    for (const row of structured.list) {
      const k = row.word.toLowerCase();
      const entry = structuredRowToItem(row);
      map.set(k, entry);
    }
    const loose = parseVocabTextToWords(raw);
    for (const row of loose) {
      const k = row.word.toLowerCase();
      if (!map.has(k)) {
        map.set(k, {
          word: row.word,
          meaning: row.meaning.trim() || '未提供释义',
          phonetic: row.phonetic || '',
        });
        continue;
      }
      const prev = map.get(k)!;
      const looseLen = row.meaning.trim().length;
      const prevLen = prev.meaning === '未提供释义' ? 0 : prev.meaning.length;
      if (row.meaning && looseLen > prevLen) {
        map.set(k, {
          word: prev.word,
          meaning: row.meaning.trim() || '未提供释义',
          phonetic: prev.phonetic || row.phonetic || '',
        });
      } else if (!prev.phonetic && row.phonetic) {
        map.set(k, { ...prev, phonetic: row.phonetic });
      }
    }
    items = [...map.values()];
  } else {
    items = structured.list.map((row) => structuredRowToItem(row));
    const loose = parseVocabTextToWords(raw);
    const seenLower = new Set(structured.list.map((r) => r.word.toLowerCase()));
    for (const row of loose) {
      const k = row.word.toLowerCase();
      if (seenLower.has(k)) continue;
      seenLower.add(k);
      items.push({
        word: row.word,
        meaning: row.meaning.trim() || '未提供释义',
        phonetic: row.phonetic || '',
      });
    }
  }

  if (items.length > MAX_WORDS) {
    items = items.slice(0, MAX_WORDS);
  }

  return {
    items,
    totalLines: structured.totalLines,
    skippedCount: structured.skippedCount,
    skippedSamples: structured.skippedSamples,
    structuredRowCount,
  };
}
