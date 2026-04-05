import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearScanResumeStorage,
  readScanResumeFromStorage,
  writeScanResumeToStorage,
  SCAN_RESUME_STORAGE_KEY,
} from './scanResumeStorage';

describe('scanResumeStorage', () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal(
      'localStorage',
      {
        getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
        setItem: (k: string, v: string) => void m.set(k, v),
        removeItem: (k: string) => void m.delete(k),
        clear: () => m.clear(),
        key: (i: number) => Array.from(m.keys())[i] ?? null,
        get length() {
          return m.size;
        },
      } as Storage
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('读写后能读回', () => {
    const p = {
      v: 1 as const,
      bookId: 'b1',
      calendarDate: '2026-03-28',
      cycleDay: 1,
      cursorAtSessionStart: 0,
      dailyPlanWords: 150 as const,
      currentIndex: 1,
      words: [{ id: '1', word: 'a' }],
      outcomes: { new: 0, familiar_70: 0, familiar_100: 0 },
    };
    writeScanResumeToStorage(p);
    const r = readScanResumeFromStorage();
    expect(r).not.toBeNull();
    expect(r?.bookId).toBe('b1');
    expect(r?.currentIndex).toBe(1);
    expect(Array.isArray(r?.words)).toBe(true);
  });

  it('clearScanResumeStorage 移除项', () => {
    localStorage.setItem(SCAN_RESUME_STORAGE_KEY, '{}');
    clearScanResumeStorage();
    expect(localStorage.getItem(SCAN_RESUME_STORAGE_KEY)).toBeNull();
  });
});
