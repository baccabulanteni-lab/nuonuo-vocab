import { safeJsonParse } from './safeJsonParse';
import { addBeijingCalendarDays, getBeijingDateKey } from './beijingDate';

const STORAGE_KEY = 'vocab_today_scan_batches';

/** 北京日历日 -> 书 id -> 当日在扫词模式「整批完成」累计的词数（与手势标成生词/熟词无关） */
type ScanMap = Record<string, Record<string, number>>;

/** 词书库「今日目标」旁：本日已扫完词数（仅统计当日完成的扫词批次） */
export function getTodayScannedWordCount(bookId: string): number {
  if (typeof localStorage === 'undefined') return 0;
  const dk = getBeijingDateKey();
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  return map[dk]?.[bookId] ?? 0;
}

/** 读取指定北京日历日的已扫完词数（用于跨日通关兜底校验） */
export function getScannedWordCountOnDate(bookId: string, dateKey: string): number {
  if (typeof localStorage === 'undefined') return 0;
  if (!bookId || !dateKey) return 0;
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  return map[dateKey]?.[bookId] ?? 0;
}

/** 扫词整批结束、合并进书时调用，累加本批词数 */
export function recordTodayScanBatchCompleted(bookId: string, batchSize: number) {
  if (typeof localStorage === 'undefined' || !bookId || batchSize <= 0) return;
  const dk = getBeijingDateKey();
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  if (!map[dk]) map[dk] = {};
  map[dk][bookId] = (map[dk][bookId] ?? 0) + batchSize;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // 配额满时忽略，与续学快照一致
  }
}

/** 
 * 按当日计划档位将「今日已扫」硬性封顶，避免历史残留导致显示超量。
 * 返回校准后的值。
 */
export function clampTodayScannedWordCount(bookId: string, dailyPlanWords: number): number {
  const limit = Number.isFinite(dailyPlanWords) ? Math.max(0, Math.floor(dailyPlanWords)) : 0;
  if (typeof localStorage === 'undefined') return 0;
  if (!bookId || limit <= 0) return 0;
  const dk = getBeijingDateKey();
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  let raw = map[dk]?.[bookId] ?? 0;

  // 数据自愈修复（兜底）：如果在挑战记录里今日已经通关了，但扫词批次却因为旧 Bug 被 clamp 成了 0，
  // 我们在这里直接强行补齐到满额，这样用户的界面上就能马上恢复“今日已扫完”状态。
  const challengeMap = safeJsonParse<Record<string, { completedOnDate?: string }>>(
    localStorage.getItem('vocab_daily_challenge'),
    {}
  );
  if (challengeMap[bookId]?.completedOnDate === dk && raw < limit) {
    raw = limit;
  }

  const clamped = Math.min(Math.max(0, raw), limit);
  if ((raw !== clamped || !map[dk] || map[dk][bookId] !== clamped) && map[dk]) {
    map[dk][bookId] = clamped;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // 与其他本地缓存一致：配额不足时忽略
    }
  }
  return clamped;
}

/** 挑战失败重置时，避免词书库仍显示当日已扫 */
export function clearTodayScanForBook(bookId: string) {
  if (typeof localStorage === 'undefined' || !bookId) return;
  const dk = getBeijingDateKey();
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  if (map[dk]?.[bookId] == null) return;
  delete map[dk][bookId];
  if (Object.keys(map[dk]).length === 0) delete map[dk];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** 该书最近一次「当日整批扫词有累计」的北京时间日历日（无则 null） */
export function getBookLastActivityDateKey(bookId: string): string | null {
  if (typeof localStorage === 'undefined' || !bookId) return null;
  const map = safeJsonParse<ScanMap>(localStorage.getItem(STORAGE_KEY), {});
  let best: string | null = null;
  for (const dk of Object.keys(map)) {
    const n = map[dk]?.[bookId] ?? 0;
    if (n > 0 && (!best || dk > best)) best = dk;
  }
  return best;
}

/**
 * 以「最近有扫词活动的那一天」为终点，向前连续有活动的日历日天数（与热力图同源：整批扫词累计）。
 */
export function getBookConsecutiveScanDays(bookId: string): number {
  const last = getBookLastActivityDateKey(bookId);
  if (!last) return 0;
  let d = last;
  let streak = 0;
  const map = safeJsonParse<ScanMap>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
    {}
  );
  while (true) {
    const n = map[d]?.[bookId] ?? 0;
    if (n <= 0) break;
    streak += 1;
    d = addBeijingCalendarDays(d, -1);
  }
  return streak;
}
