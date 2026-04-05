import { getBeijingDateKey } from './beijingDate';

type CycleReviewSessionV1 = {
  v: 1;
  currentIndex: number;
  wordId: string;
};

function storageKey(bookId: string, cycleDay: number, dateKey: string) {
  return `vocab_cycle_review_session_v1_${bookId}_day${Math.floor(cycleDay)}_${dateKey}`;
}

export function saveCycleReviewSession(params: {
  bookId: string;
  cycleDay: number;
  currentIndex: number;
  wordId: string;
  dateKey?: string;
}) {
  if (typeof localStorage === 'undefined') return;
  try {
    const dateKey = params.dateKey ?? getBeijingDateKey();
    const payload: CycleReviewSessionV1 = {
      v: 1,
      currentIndex: Math.max(0, Math.floor(params.currentIndex)),
      wordId: String(params.wordId || ''),
    };
    if (!payload.wordId) return;
    localStorage.setItem(storageKey(params.bookId, params.cycleDay, dateKey), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function readCycleReviewSession(params: {
  bookId: string;
  cycleDay: number;
  dateKey?: string;
}): { currentIndex: number; wordId: string } | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const dateKey = params.dateKey ?? getBeijingDateKey();
    const raw = localStorage.getItem(storageKey(params.bookId, params.cycleDay, dateKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CycleReviewSessionV1>;
    if (parsed?.v !== 1 || typeof parsed.wordId !== 'string' || !parsed.wordId) return null;
    const currentIndex = Number(parsed.currentIndex);
    if (!Number.isFinite(currentIndex) || currentIndex < 0) return null;
    return { currentIndex: Math.floor(currentIndex), wordId: parsed.wordId };
  } catch {
    return null;
  }
}

export function clearCycleReviewSession(params: { bookId: string; cycleDay: number; dateKey?: string }) {
  if (typeof localStorage === 'undefined') return;
  try {
    const dateKey = params.dateKey ?? getBeijingDateKey();
    localStorage.removeItem(storageKey(params.bookId, params.cycleDay, dateKey));
  } catch {
    // ignore
  }
}
