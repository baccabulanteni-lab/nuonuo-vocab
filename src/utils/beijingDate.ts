/** 中国标准时间（北京时间），与 IANA 时区数据库一致 */
const BEIJING = 'Asia/Shanghai';

/**
 * 当前时刻在「北京时间」下的日历日 YYYY-MM-DD。
 * 用于每日挑战跨日判定，避免 `toISOString()` 使用 UTC 导致国内用户午夜前后错日。
 */
export function getBeijingDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BEIJING,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (y == null || m == null || d == null) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: BEIJING }).format(date);
  }
  return `${y}-${m}-${d}`;
}

/**
 * 以北京日历日为基准加减整数天（用于热力图、昨日统计等）。
 * 使用当日中午 Asia/Shanghai 锚点，避免夏令时/机器本地时区干扰（中国无夏令时）。
 */
export function addBeijingCalendarDays(fromKey: string, deltaDays: number): string {
  const parts = fromKey.split('-').map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return getBeijingDateKey();
  }
  const [y, m, d] = parts;
  const pad = (n: number) => String(n).padStart(2, '0');
  const anchor = new Date(`${y}-${pad(m)}-${pad(d)}T12:00:00+08:00`);
  const next = new Date(anchor.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return getBeijingDateKey(next);
}

/** 北京时间的「昨天」对应 YYYY-MM-DD */
export function getBeijingYesterdayKey(): string {
  return addBeijingCalendarDays(getBeijingDateKey(), -1);
}

/** YYYY-MM-DD → 界面短文案，如 4月3日 */
export function formatDateKeyAsShortZh(dateKey: string): string {
  const parts = dateKey.split('-').map((s) => parseInt(s, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return dateKey;
  const [, m, d] = parts;
  return `${m}月${d}日`;
}
