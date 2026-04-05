/** 解析 localStorage 等来源的 JSON，避免损坏数据导致整页白屏 */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
