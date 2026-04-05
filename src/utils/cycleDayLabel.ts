/** 将词条上的 addedOn 规范为与 UI 一致的 `Day N`（去首尾空白、兼容大小写与 Day 与数字间空格） */
export function canonicalCycleDayLabel(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^Day\s*(\d+)$/i);
  return m ? `Day ${m[1]}` : null;
}
