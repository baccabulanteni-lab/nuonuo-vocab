import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordTodayScanBatchCompleted,
  getTodayScannedWordCount,
  clampTodayScannedWordCount,
  clearTodayScanForBook,
  getBookLastActivityDateKey,
  getBookConsecutiveScanDays,
} from './todayScanProgress';

vi.mock('./beijingDate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./beijingDate')>();
  return {
    ...actual,
    getBeijingDateKey: () => '2026-03-28',
  };
});

function mockLocalStorage() {
  const store: Record<string, string> = {};
  vi.stubGlobal(
    'localStorage',
    {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    } as Storage
  );
}

describe('todayScanProgress', () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  it('累加同一书当日整批词数', () => {
    recordTodayScanBatchCompleted('book-a', 150);
    expect(getTodayScannedWordCount('book-a')).toBe(150);
    recordTodayScanBatchCompleted('book-a', 100);
    expect(getTodayScannedWordCount('book-a')).toBe(250);
  });

  it('clearTodayScanForBook 清空当日该书', () => {
    recordTodayScanBatchCompleted('book-a', 150);
    clearTodayScanForBook('book-a');
    expect(getTodayScannedWordCount('book-a')).toBe(0);
  });

  it('clampTodayScannedWordCount 会按档位封顶并回写', () => {
    recordTodayScanBatchCompleted('book-a', 150);
    recordTodayScanBatchCompleted('book-a', 180);
    expect(getTodayScannedWordCount('book-a')).toBe(330);
    expect(clampTodayScannedWordCount('book-a', 150)).toBe(150);
    expect(getTodayScannedWordCount('book-a')).toBe(150);
  });

  it('getBookLastActivityDateKey 取最近有累计的日历日', () => {
    localStorage.setItem(
      'vocab_today_scan_batches',
      JSON.stringify({
        '2026-03-20': { 'book-x': 10 },
        '2026-03-28': { 'book-x': 150 },
      })
    );
    expect(getBookLastActivityDateKey('book-x')).toBe('2026-03-28');
    expect(getBookLastActivityDateKey('missing')).toBe(null);
  });

  it('getBookConsecutiveScanDays 从最近有活动日向前数连续日', () => {
    localStorage.setItem(
      'vocab_today_scan_batches',
      JSON.stringify({
        '2026-03-28': { 'book-x': 150 },
        '2026-03-27': { 'book-x': 150 },
        '2026-03-25': { 'book-x': 150 },
      })
    );
    expect(getBookConsecutiveScanDays('book-x')).toBe(2);
  });
});
