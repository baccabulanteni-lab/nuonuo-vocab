import type { WordStatus } from '../types/vocabularyWord';

export type BookWordLike = {
  id: string;
  status?: WordStatus;
  review_count?: number;
};

export type CorpusPreview = {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
};

/** 轮次从 1 计；第 1 轮为全书顺序；第 2 轮起为未全熟词经确定性洗牌后的队列 */
export function getEffectiveStudyPass(book: { studyPass?: number } | null | undefined): number {
  const p = book?.studyPass;
  return typeof p === 'number' && p >= 1 ? Math.floor(p) : 1;
}

function statusOf(id: string, bookWords: BookWordLike[] | undefined): WordStatus {
  const w = bookWords?.find((x) => x.id === id);
  return w?.status ?? 'new';
}

function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = items.slice();
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 按全书词表统计未全熟数量（未出现在 bookWords 的 id 视为生词） */
export function countNotFullyMasteredFromCorpus(
  raw: CorpusPreview[],
  bookWords: BookWordLike[] | undefined
): number {
  return raw.filter((r) => statusOf(r.id, bookWords) !== 'familiar_100').length;
}

/**
 * 构建当前轮用于 slice 的完整队列（与游标同序）。
 * pass<=1：与词表文件顺序一致；pass>=2：仅保留非全熟，再按轮次稳定洗牌。
 */
export function buildStudyQueueForPass(
  raw: CorpusPreview[],
  bookWords: BookWordLike[] | undefined,
  pass: number,
  bookId: string
): CorpusPreview[] {
  if (pass <= 1) return raw;
  const filtered = raw.filter((r) => statusOf(r.id, bookWords) !== 'familiar_100');
  return deterministicShuffle(filtered, `${bookId}\0pass\0${pass}`);
}

/** 本书「全熟」占比进度 0–100（跨轮次，唯一展示用进度之一） */
export function computeMasteryProgressPercent(
  bookWords: BookWordLike[] | undefined,
  totalInBook: number
): number {
  if (totalInBook <= 0) return 0;
  const mastered = bookWords?.filter((w) => w.status === 'familiar_100').length ?? 0;
  return Math.min(100, Math.round((mastered / totalInBook) * 100));
}
