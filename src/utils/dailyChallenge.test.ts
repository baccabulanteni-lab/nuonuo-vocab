import { describe, it, expect, beforeEach, vi } from 'vitest';

const { getTodayKey, setTodayKey } = vi.hoisted(() => {
  let key = '2026-03-28';
  return {
    getTodayKey: () => key,
    setTodayKey: (k: string) => {
      key = k;
    },
  };
});

vi.mock('./beijingDate', () => ({
  getBeijingDateKey: () => getTodayKey(),
}));

vi.mock('./scanResumeStorage', () => ({
  clearScanResumeStorage: vi.fn(),
}));

import {
  checkCalendarRollover,
  applyNewDayAfterSuccess,
  getBookChallenge,
} from './dailyChallenge';

const CHALLENGE_KEY = 'vocab_daily_challenge';

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

function setDailyPlanBook(bookId: string) {
  localStorage.setItem(
    'vocab_focus_books',
    JSON.stringify([{ id: bookId, dailyPlanWords: 150, title: 't' }])
  );
}

function setChallengeState(
  bookId: string,
  partial: {
    startedDate: string | null;
    completedOnDate: string | null;
    maxUnlockedCycleDay?: number;
  }
) {
  const base = {
    startedDate: partial.startedDate,
    completedOnDate: partial.completedOnDate,
    maxUnlockedCycleDay: partial.maxUnlockedCycleDay ?? 1,
  };
  localStorage.setItem(CHALLENGE_KEY, JSON.stringify({ [bookId]: base }));
}

describe('checkCalendarRollover', () => {
  const bid = 'book-1';

  beforeEach(() => {
    mockLocalStorage();
    setTodayKey('2026-03-28');
    setDailyPlanBook(bid);
  });

  it('无 bookId 时为 none', () => {
    expect(checkCalendarRollover(null)).toEqual({ type: 'none' });
  });

  it('未选每日词量时为 none', () => {
    localStorage.removeItem('vocab_focus_books');
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: '2026-03-27',
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'none' });
  });

  it('尚未开始挑战（无 startedDate）为 none', () => {
    setChallengeState(bid, { startedDate: null, completedOnDate: null });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'none' });
  });

  it('开始日仍是「今天」时不跨日，为 none', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-28',
      completedOnDate: null,
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'none' });
  });

  it('已跨自然日但未记通关日为 failure', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: null,
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'failure', bookId: bid });
  });

  it('completedOnDate 丢失但 startedDate 当日已达档位：兜底判定为 newDayAfterSuccess', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: null,
    });
    localStorage.setItem(
      'vocab_today_scan_batches',
      JSON.stringify({
        '2026-03-27': { [bid]: 150 },
      })
    );
    expect(checkCalendarRollover(bid)).toEqual({ type: 'newDayAfterSuccess', bookId: bid });
  });

  it('完成日早于开始日为 failure', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: '2026-03-26',
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'failure', bookId: bid });
  });

  it('开始于昨天、今天在「今天」才记通关：completedOnDate>=today，不重复 rollover', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: '2026-03-28',
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'none' });
  });

  it('昨天开始且昨天已整批通关：今天应 newDayAfterSuccess', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: '2026-03-27',
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'newDayAfterSuccess', bookId: bid });
  });

  it('前天开始、昨天才扫完整批（跨午夜）：今天仍 newDayAfterSuccess', () => {
    setChallengeState(bid, {
      startedDate: '2026-03-26',
      completedOnDate: '2026-03-27',
    });
    expect(checkCalendarRollover(bid)).toEqual({ type: 'newDayAfterSuccess', bookId: bid });
  });
});

describe('applyNewDayAfterSuccess', () => {
  const bid = 'book-2';

  beforeEach(() => {
    mockLocalStorage();
    setTodayKey('2026-03-28');
    setDailyPlanBook(bid);
    setChallengeState(bid, {
      startedDate: '2026-03-27',
      completedOnDate: '2026-03-27',
      maxUnlockedCycleDay: 5,
    });
  });

  it('清空当日标记并把 maxUnlockedCycleDay 设为传入的循环日', () => {
    applyNewDayAfterSuccess(bid, 2);
    const s = getBookChallenge(bid);
    expect(s.startedDate).toBeNull();
    expect(s.completedOnDate).toBeNull();
    expect(s.maxUnlockedCycleDay).toBe(2);
  });

  it('循环日钳在 1～5', () => {
    applyNewDayAfterSuccess(bid, 99);
    expect(getBookChallenge(bid).maxUnlockedCycleDay).toBe(5);
    applyNewDayAfterSuccess(bid, 0);
    expect(getBookChallenge(bid).maxUnlockedCycleDay).toBe(1);
  });
});
