import { describe, expect, it } from 'vitest';
import {
  mergeSessionWordsIntoBookWords,
  computeScanBatchBookPatch,
} from './mergeSessionWordsIntoBook';

describe('mergeSessionWordsIntoBookWords', () => {
  it('合并时后者覆盖同 id 字段', () => {
    type R = { id: string; word: string; status?: string };
    const a: R[] = [{ id: '1', word: 'a', status: 'new' }];
    const b: R[] = [{ id: '1', word: 'a', status: 'familiar_100' }];
    const r = mergeSessionWordsIntoBookWords(a, b);
    expect(r).toHaveLength(1);
    expect(r[0].status).toBe('familiar_100');
  });

  it('会话中新 id 会追加', () => {
    const existing = [{ id: '1', word: 'x' }];
    const session = [{ id: '2', word: 'y' }];
    const r = mergeSessionWordsIntoBookWords(existing, session);
    expect(r.map((x) => x.id).sort()).toEqual(['1', '2']);
  });
});

describe('computeScanBatchBookPatch', () => {
  it('计算下一游标与进度', () => {
    const r = computeScanBatchBookPatch({
      existingBookWords: [],
      mergeSource: [{ id: '1' }, { id: '2' }],
      batchWordCount: 2,
      studyCursorBefore: 10,
      bookWordCountEstimate: 100,
    });
    expect(r.nextStudyCursor).toBe(12);
    expect(r.progressPercent).toBe(12);
    expect(r.mergedWords).toHaveLength(2);
  });

  it('无 book count 时用 nextCursor 作保守分母', () => {
    const r = computeScanBatchBookPatch({
      existingBookWords: undefined,
      mergeSource: [{ id: 'a' }],
      batchWordCount: 1,
      studyCursorBefore: 4,
      bookWordCountEstimate: undefined,
    });
    expect(r.nextStudyCursor).toBe(5);
    expect(r.progressPercent).toBe(100);
  });
});
