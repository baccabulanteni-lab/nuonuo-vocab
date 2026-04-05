import { describe, it, expect } from 'vitest';
import { scanResumeMatchesSession } from './scanResumeSession';

describe('scanResumeMatchesSession', () => {
  const base = {
    bookId: 'book-a',
    calendarDate: '2026-03-28',
    cycleDay: 1,
    dailyPlanWords: 150 as const,
    currentIndex: 2,
    words: [0, 1, 2, 3],
  };

  it('同一天同书同词量且索引合法时通过', () => {
    expect(scanResumeMatchesSession(base, 'book-a', 150, '2026-03-28', 1, 1)).toBe(true);
  });

  it('书不一致时拒绝', () => {
    expect(scanResumeMatchesSession(base, 'book-b', 150, '2026-03-28', 1, 1)).toBe(false);
  });

  it('自然日不一致时拒绝', () => {
    expect(scanResumeMatchesSession(base, 'book-a', 150, '2026-03-29', 1, 1)).toBe(false);
  });

  it('每日词量不一致时拒绝', () => {
    expect(scanResumeMatchesSession(base, 'book-a', 300, '2026-03-28', 1, 1)).toBe(false);
  });

  it('currentIndex 越界时拒绝', () => {
    expect(
      scanResumeMatchesSession({ ...base, currentIndex: 4 }, 'book-a', 150, '2026-03-28')
    ).toBe(false);
  });

  it('词表为空时拒绝', () => {
    expect(
      scanResumeMatchesSession({ ...base, words: [], currentIndex: 0 }, 'book-a', 150, '2026-03-28')
    ).toBe(false);
  });

  it('循环日不一致时拒绝', () => {
    expect(scanResumeMatchesSession(base, 'book-a', 150, '2026-03-28', 1, 3)).toBe(false);
    expect(scanResumeMatchesSession({ ...base, cycleDay: 3 }, 'book-a', 150, '2026-03-28', 1, 3)).toBe(true);
  });

  it('轮次不一致时拒绝', () => {
    expect(scanResumeMatchesSession(base, 'book-a', 150, '2026-03-28', 2, 1)).toBe(false);
    expect(scanResumeMatchesSession({ ...base, studyPass: 2 }, 'book-a', 150, '2026-03-28', 2, 1)).toBe(true);
  });
});
