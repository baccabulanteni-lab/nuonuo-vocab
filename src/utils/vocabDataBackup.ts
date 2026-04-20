import { SCAN_RESUME_STORAGE_KEY } from './scanResumeStorage';
import { STUDY_CURSOR_STORAGE_KEY } from './studyCursor';
import { getIdbItem } from './idbStorage';

/** 需要随备份导出的 localStorage 键（词书与进度相关；不含浏览器词表缓存） */
export const VOCAB_BACKUP_STORAGE_KEYS = [
  'vocab_focus_books',
  'vocab_collection_books',
  'vocab_custom_books',
  'vocab_stats',
  'vocab_plan',
  'vocab_current_day',
  STUDY_CURSOR_STORAGE_KEY,
  'vocab_daily_challenge',
  SCAN_RESUME_STORAGE_KEY,
  'vocab_today_scan_batches',
  'vocab_cycle_review_session',
] as const;

export type VocabBackupPayload = {
  v: 1;
  exportedAt: string;
  keys: Record<string, string | null>;
};

export function collectVocabLocalStorageSnapshot(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (typeof localStorage === 'undefined') return out;
  for (const key of VOCAB_BACKUP_STORAGE_KEYS) {
    try {
      out[key] = localStorage.getItem(key);
    } catch {
      out[key] = null;
    }
  }
  return out;
}

/** 异步采集快照：支持从 IndexedDB 读取大容量 Key (vocab_focus_books, vocab_custom_books) */
export async function collectVocabDataSnapshotAsync(): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  if (typeof localStorage === 'undefined') return out;

  for (const key of VOCAB_BACKUP_STORAGE_KEYS) {
    try {
      // 这里的 Key 如果在 VocabularyModule 中已被迁移至 IDB，则优先从 IDB 读取
      if (key === 'vocab_focus_books' || key === 'vocab_custom_books') {
        const idbVal = await getIdbItem(key);
        if (idbVal !== null) {
          out[key] = JSON.stringify(idbVal);
          continue;
        }
      }
      // 兜底或普通 Key 从 localStorage 读取
      out[key] = localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Backup] 采集 Key=${key} 失败:`, e);
      out[key] = null;
    }
  }
  return out;
}

export function downloadVocabBackupJson(filename?: string) {
  const payload: VocabBackupPayload = {
    v: 1,
    exportedAt: new Date().toISOString(),
    keys: collectVocabLocalStorageSnapshot(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `nuonuo-vocab-backup-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ParseBackupResult =
  | { ok: true; payload: VocabBackupPayload }
  | { ok: false; error: string };

/** 校验并解析应用导出的 v1 备份 JSON 文本 */
export function parseVocabBackupJson(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '文件不是有效的 JSON' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: '备份根对象格式无效' };
  }
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) {
    return { ok: false, error: '仅支持 v1 备份，请使用本应用导出的文件' };
  }
  if (typeof o.exportedAt !== 'string' || o.exportedAt.length < 10) {
    return { ok: false, error: '备份缺少导出时间' };
  }
  const keyBag = o.keys;
  if (!keyBag || typeof keyBag !== 'object' || Array.isArray(keyBag)) {
    return { ok: false, error: '备份缺少 keys 字段' };
  }
  const keys = keyBag as Record<string, unknown>;
  let knownTouched = 0;
  for (const k of VOCAB_BACKUP_STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(keys, k)) continue;
    knownTouched += 1;
    const v = keys[k];
    if (v !== null && typeof v !== 'string') {
      return { ok: false, error: `键「${k}」内容类型无效` };
    }
  }
  if (knownTouched === 0) {
    return { ok: false, error: '备份中没有任何可识别的学习数据键' };
  }
  const normalized: Record<string, string | null> = {};
  for (const k of VOCAB_BACKUP_STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(keys, k)) continue;
    const v = keys[k];
    normalized[k] = v === null ? null : (v as string);
  }
  const payload: VocabBackupPayload = {
    v: 1,
    exportedAt: o.exportedAt,
    keys: normalized as VocabBackupPayload['keys'],
  };
  return { ok: true, payload };
}

export type ApplyBackupResult = { ok: true } | { ok: false; error: string };

/**
 * 将备份中的键写回 localStorage：仅覆盖备份里出现的已知键；值为 null 时 removeItem。
 */
export function applyVocabBackupToLocalStorage(payload: VocabBackupPayload): ApplyBackupResult {
  if (typeof localStorage === 'undefined') {
    return { ok: false, error: '当前环境无法使用本地存储' };
  }
  try {
    for (const k of VOCAB_BACKUP_STORAGE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(payload.keys, k)) continue;
      const v = payload.keys[k];
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: '写入失败（可能存储已满或被浏览器禁止）' };
  }
}
