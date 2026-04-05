import type { CorpusPreview } from './studyPassQueue';

export type CycleBatchPreview = {
  batchIndex: number;
  items: CorpusPreview[];
  /** 5 日循环内：首次「新学扫词」落在第几天（与扫词 addedOn 一致） */
  introCycleDay: 1 | 3;
  /** 对应复习环（循环复习日） */
  reviewCycleDay: 2 | 4;
  part: 'A' | 'B';
  /** 从 1 计：第几个 5 日节点（每节点含 A 批 + B 批） */
  fiveDayNodeIndex1: number;
};

/**
 * 与 useScanCorpusBootstrap 一致：按队列顺序每 daily 词一批；
 * 偶数批 → 循环日 1 新学 Part A，奇数批 → 循环日 3 新学 Part B。
 */
export function buildCycleBatchesFromQueue(
  queue: CorpusPreview[],
  daily: number
): CycleBatchPreview[] {
  const d = Math.max(1, Math.floor(daily));
  const out: CycleBatchPreview[] = [];
  for (let start = 0, b = 0; start < queue.length; start += d, b++) {
    const items = queue.slice(start, start + d);
    const even = b % 2 === 0;
    out.push({
      batchIndex: b,
      items,
      introCycleDay: even ? 1 : 3,
      reviewCycleDay: even ? 2 : 4,
      part: even ? 'A' : 'B',
      fiveDayNodeIndex1: Math.floor(b / 2) + 1,
    });
  }
  return out;
}
