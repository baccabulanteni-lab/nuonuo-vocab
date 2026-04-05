import { getBeijingDateKey } from './beijingDate';

export type ReviewCompletionSummary = {
  new: number;
  familiar_70: number;
  familiar_100: number;
};

function keyFor(bookId: string, cycleDay: number, dateKey: string) {
  return `vocab_review_completed_v1_${bookId}_day${cycleDay}_${dateKey}`;
}

export function markReviewCompleted(params: {
  bookId: string;
  cycleDay: number;
  summary: ReviewCompletionSummary;
  // 允许外部传入 dateKey 以便测试/一致性；默认按北京时间今天
  dateKey?: string;
}) {
  const dateKey = params.dateKey ?? getBeijingDateKey();
  const k = keyFor(params.bookId, params.cycleDay, dateKey);
  const payload = {
    v: 1,
    completedAt: new Date().toISOString(),
    summary: params.summary,
  };
  localStorage.setItem(k, JSON.stringify(payload));
}

export function readReviewCompletion(params: {
  bookId: string;
  cycleDay: number;
  dateKey?: string;
}): ReviewCompletionSummary | null {
  const dateKey = params.dateKey ?? getBeijingDateKey();
  const k = keyFor(params.bookId, params.cycleDay, dateKey);
  const raw = localStorage.getItem(k);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;
    const s = parsed?.summary;
    if (!s || typeof s !== 'object') return null;
    return {
      new: Number(s.new ?? 0) || 0,
      familiar_70: Number(s.familiar_70 ?? 0) || 0,
      familiar_100: Number(s.familiar_100 ?? 0) || 0,
    };
  } catch {
    return null;
  }
}

