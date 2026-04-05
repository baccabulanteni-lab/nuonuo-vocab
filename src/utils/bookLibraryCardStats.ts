import { formatDateKeyAsShortZh } from './beijingDate';
import { getBookLastActivityDateKey, getBookConsecutiveScanDays } from './todayScanProgress';
import type { DailyPlanWords } from './scanResumeSession';

export type BookLibraryCardStatsLines = { last: string; streak: string; eta: string };

/**
 * 按当前每日计划粗算「剩余未全熟词量 ÷ 每日词数」的天数上限（简易展示，非节点模型）。
 */
export function formatBookEtaRemainingDays(
  count: number | undefined,
  progress: number | undefined,
  dailyPlanWords: DailyPlanWords | undefined | null
): string {
  const c = Math.max(0, Math.floor(count ?? 0));
  const p = Math.min(100, Math.max(0, Math.floor(progress ?? 0)));
  if (c === 0) return '—';
  if (p >= 100) return '已通关';
  const d = dailyPlanWords;
  if (d == null || !(Number(d) > 0)) return '未立约';
  const remaining = Math.max(0, Math.round((c * (100 - p)) / 100));
  if (remaining <= 0) return '即将达成';
  const days = Math.ceil(remaining / d);
  return `约 ${days} 天`;
}

export function buildBookLibraryCardStatsLines(book: {
  id: string;
  count?: number;
  progress?: number;
  dailyPlanWords?: DailyPlanWords | null;
}): BookLibraryCardStatsLines {
  const lastKey = getBookLastActivityDateKey(book.id);
  const last = lastKey ? formatDateKeyAsShortZh(lastKey) : '—';
  const streakN = getBookConsecutiveScanDays(book.id);
  const streak = streakN > 0 ? `${streakN} 天` : '—';
  const eta = formatBookEtaRemainingDays(book.count, book.progress, book.dailyPlanWords ?? undefined);
  return { last, streak, eta };
}
