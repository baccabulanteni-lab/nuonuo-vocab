import type { DailyPlanWords } from './scanResumeSession';

/**
 * 第一轮（破冰）过完整词表的粗算：每 5 日节点学 2×daily 个新词（两 Part），节点数 = ceil(N / 2d)，自然日下限 ≈ 节点数×5。
 * 未计入停学、补练；二刷/三刷在全书通关后另计，不叠进本返回值。
 */
export function estimateFirstPassNodesAndDays(
  totalWords: number,
  daily: DailyPlanWords
): { nodes: number; daysMin: number } {
  const N = Math.max(0, Math.floor(totalWords));
  if (N === 0) return { nodes: 0, daysMin: 0 };
  const perNode = 2 * daily;
  const nodes = Math.ceil(N / perNode);
  return { nodes, daysMin: nodes * 5 };
}

/** 每本书在词库选的每日新词量；全书未背完前不可改（类型定义在 scanResumeSession） */

export function wordsToPlanTimeMin(words: number): number {
  if (words >= 1000) return 180;
  if (words >= 300) return 60;
  return 30;
}

/** 仅用于界面展示：终极净化规则 —— 剔除星号、音标、词性 (ad./v./n.)、中文以及一切非单词噪音 */
export function displayWordLowerFirst(word: string | undefined | null): string {
  if (word == null || word.length === 0) return word ?? '';
  
  // 1. 基础净化：小写化并剔除星号、井号、加号
  let cleaned = word.toLocaleLowerCase('en-US').replace(/[\*\#\+]/g, '');

  // 2. 剥离音标及其后的所有内容 (从第一个 / 或 [ 开始切断)
  cleaned = cleaned.split('/')[0].split('[')[0];

  // 3. 剔除常见的词性标记 (ad. / v. / n. / adj. / prep. / conj. / pron. / art.)
  const posRegex = /\s+(ad|v|n|adj|prep|conj|pron|art|adv|num|int|vi|vt)\.\s*/g;
  cleaned = cleaned.replace(posRegex, ' ');

  // 4. 暴力剔除中文字符 ([\u4e00-\u9fa5]) 及其它广义非 ASCII 字符 (针对混入的乱码释义)
  cleaned = cleaned.replace(/[^\x00-\x7F]+/g, '');

  // 5. 最终修剪：去掉两头空白并合并中间多余空格
  cleaned = cleaned.trim().replace(/\s+/g, ' ');
  
  if (cleaned.length === 0) return '';
  return cleaned;
}

/** 词表搜索：去空白、全半角与零宽字符，减少平板输入法的误匹配 */
export function normalizeWordListSearch(s: string): string {
  try {
    return s
      .trim()
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ');
  } catch {
    return s.trim().replace(/\s+/g, ' ');
  }
}

export function isDailyPlanLocked(book: { dailyPlanWords?: DailyPlanWords; progress?: number } | null | undefined) {
  if (!book) return false;
  return book.dailyPlanWords != null && (book.progress ?? 0) < 100;
}

/** 用户导入的自建词书：id 以 custom- 开头，或显式 isCustom（旧缓存可能缺字段） */
export function isUserCustomVocabBook(book: { id?: string; isCustom?: boolean } | null | undefined): boolean {
  if (!book?.id) return false;
  if (book.isCustom === true) return true;
  return book.id.startsWith('custom-');
}

/** 去掉首尾 /、方括号等后，再弱化比较前导重音/撇号（词典写法不一） */
function ipaComparable(s: string): string {
  const stripped = s
    .trim()
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .trim();
  return stripped.replace(/^[\u2018\u2019'ˈˌ]+/, '').trim();
}

/** 释义开头常带 [音标]、/音标/ 等，与独立 phonetic 重复时去掉该前缀（仅影响展示） */
export function stripDuplicateLeadingPhoneticFromMeaning(
  meaning: string | undefined | null,
  phonetic: string | undefined | null
): string {
  if (meaning == null || meaning === '') return '';
  if (phonetic == null || phonetic.trim() === '') return meaning;

  const p = ipaComparable(phonetic);
  if (!p) return meaning;

  const trimmed = meaning.trim();

  const bracket = trimmed.match(/^[\[【]([^\]】]+)[\]】]\s*/);
  if (bracket && ipaComparable(bracket[1]) === p) {
    return trimmed.slice(bracket[0].length).trim();
  }

  const slash = trimmed.match(/^\/([^/\n]+)\/\s*/);
  if (slash && ipaComparable(slash[1]) === p) {
    return trimmed.slice(slash[0].length).trim();
  }

  return meaning;
}
