import { safeJsonParse } from './safeJsonParse';

const AUTH_DB_STORAGE_KEY = 'nuonuo_auth_db_local_v1';
const AUTH_SESSION_STORAGE_KEY = 'nuonuo_auth_session';

export const AUTH_BACKUP_STORAGE_KEYS = [AUTH_DB_STORAGE_KEY, AUTH_SESSION_STORAGE_KEY] as const;

export type AuthBackupPayload = {
  v: 1;
  exportedAt: string;
  keys: Record<string, string | null>;
};

export type ParseAuthBackupResult =
  | { ok: true; payload: AuthBackupPayload }
  | { ok: false; error: string };

export function collectAuthLocalSnapshot(): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (typeof localStorage === 'undefined') return out;
  for (const k of AUTH_BACKUP_STORAGE_KEYS) {
    try {
      out[k] = localStorage.getItem(k);
    } catch {
      out[k] = null;
    }
  }
  return out;
}

export function downloadAuthBackupJson(filename?: string) {
  const payload: AuthBackupPayload = {
    v: 1,
    exportedAt: new Date().toISOString(),
    keys: collectAuthLocalSnapshot(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `nuonuo-auth-backup-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseAuthBackupJson(text: string): ParseAuthBackupResult {
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
  if (o.v !== 1) return { ok: false, error: '仅支持 v1 备份' };
  if (typeof o.exportedAt !== 'string' || o.exportedAt.length < 10) {
    return { ok: false, error: '备份缺少导出时间' };
  }
  const keyBag = o.keys;
  if (!keyBag || typeof keyBag !== 'object' || Array.isArray(keyBag)) {
    return { ok: false, error: '备份缺少 keys 字段' };
  }
  const keys = keyBag as Record<string, unknown>;

  let knownTouched = 0;
  for (const k of AUTH_BACKUP_STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(keys, k)) continue;
    knownTouched += 1;
    const v = keys[k];
    if (v !== null && typeof v !== 'string') {
      return { ok: false, error: `键「${k}」内容类型无效` };
    }
  }
  if (knownTouched === 0) return { ok: false, error: '备份中没有任何可识别的授权库键' };

  const normalized: Record<string, string | null> = {};
  for (const k of AUTH_BACKUP_STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(keys, k)) continue;
    const v = keys[k];
    normalized[k] = v === null ? null : (v as string);
  }

  return {
    ok: true,
    payload: {
      v: 1,
      exportedAt: o.exportedAt,
      keys: normalized as AuthBackupPayload['keys'],
    },
  };
}

export type ApplyAuthBackupResult = { ok: true } | { ok: false; error: string };

export function applyAuthBackupToLocalStorage(
  payload: AuthBackupPayload
): ApplyAuthBackupResult {
  if (typeof localStorage === 'undefined') return { ok: false, error: '当前环境无法使用本地存储' };
  try {
    for (const k of AUTH_BACKUP_STORAGE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(payload.keys, k)) continue;
      const v = payload.keys[k];
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: '写入失败（可能存储已满或被浏览器禁止）' };
  }
}

