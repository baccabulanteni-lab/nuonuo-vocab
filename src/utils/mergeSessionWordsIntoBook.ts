/**
 * 将本轮扫词会话中的词条合并进书内词表（按 id），供复习模式按 addedOn 等筛选。
 */
export function mergeSessionWordsIntoBookWords<T extends { id: string }>(
  existing: T[] | undefined,
  session: T[]
): T[] {
  const map = new Map<string, T>();
  for (const w of existing || []) map.set(w.id, w);
  for (const w of session) {
    const prev = map.get(w.id);
    map.set(w.id, prev ? ({ ...prev, ...w } as T) : w);
  }
  return Array.from(map.values());
}

export type ScanBatchBookPatchInput<T extends { id: string }> = {
  existingBookWords: T[] | undefined;
  mergeSource: T[];
  /** 本批词数，用于推进 getStudyCursor（通常 vocabList.length） */
  batchWordCount: number;
  /** 合并前 getStudyCursor(bookId) */
  studyCursorBefore: number;
  /** 书上的 count（总词数估计）；缺省则用 nextStudyCursor 作分母，进度常为 100% */
  bookWordCountEstimate: number | undefined;
};

/** 扫词整批结束时：下一游标、进度百分比、并入后的词表 */
export function computeScanBatchBookPatch<T extends { id: string }>(
  input: ScanBatchBookPatchInput<T>
): { nextStudyCursor: number; progressPercent: number; mergedWords: T[] } {
  const nextStudyCursor = input.studyCursorBefore + input.batchWordCount;
  const total = Math.max(1, input.bookWordCountEstimate || nextStudyCursor);
  const progressPercent = Math.min(100, Math.round((nextStudyCursor / total) * 100));
  const mergedWords = mergeSessionWordsIntoBookWords(input.existingBookWords, input.mergeSource);
  return { nextStudyCursor, progressPercent, mergedWords };
}
