import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseVocabBackupJson, applyVocabBackupToLocalStorage, VOCAB_BACKUP_STORAGE_KEYS } from './vocabDataBackup';

function stubLocalStorage() {
  const memory = new Map<string, string>();
  vi.stubGlobal(
    'localStorage',
    {
      getItem: (k: string) => (memory.has(k) ? memory.get(k)! : null),
      setItem: (k: string, v: string) => {
        memory.set(k, v);
      },
      removeItem: (k: string) => {
        memory.delete(k);
      },
      clear: () => memory.clear(),
      key: (i: number) => Array.from(memory.keys())[i] ?? null,
      get length() {
        return memory.size;
      },
    } as Storage
  );
  return memory;
}

describe('parseVocabBackupJson', () => {
  it('拒绝非法 JSON', () => {
    const r = parseVocabBackupJson('{');
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.error).toContain('JSON');
  });

  it('拒绝错误版本', () => {
    const r = parseVocabBackupJson(
      JSON.stringify({ v: 2, exportedAt: '2026-01-01T00:00:00.000Z', keys: { vocab_stats: '{}' } })
    );
    expect(r.ok).toBe(false);
  });

  it('拒绝 keys 类型错误', () => {
    const r = parseVocabBackupJson(
      JSON.stringify({ v: 1, exportedAt: '2026-01-01T00:00:00.000Z', keys: [] })
    );
    expect(r.ok).toBe(false);
  });

  it('拒绝键值类型错误', () => {
    const r = parseVocabBackupJson(
      JSON.stringify({
        v: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        keys: { vocab_stats: 1 },
      })
    );
    expect(r.ok).toBe(false);
  });

  it('至少包含一个已知键时可解析', () => {
    const r = parseVocabBackupJson(
      JSON.stringify({
        v: 1,
        exportedAt: '2026-03-28T12:00:00.000Z',
        keys: { vocab_stats: '{"familiar_100":3}' },
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.keys['vocab_stats']).toBe('{"familiar_100":3}');
    }
  });
});

describe('applyVocabBackupToLocalStorage', () => {
  beforeEach(() => {
    stubLocalStorage();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('只覆盖备份中出现的键', () => {
    const key = VOCAB_BACKUP_STORAGE_KEYS[0];
    localStorage.setItem(key, 'before');
    localStorage.setItem('vocab_other_temp_test', 'keep');
    const payload = {
      v: 1 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      keys: { [key]: 'after' } as Record<string, string | null>,
    };
    const r = applyVocabBackupToLocalStorage(payload);
    expect(r.ok).toBe(true);
    expect(localStorage.getItem(key)).toBe('after');
    expect(localStorage.getItem('vocab_other_temp_test')).toBe('keep');
  });

  it('null 会删除该键', () => {
    const key = VOCAB_BACKUP_STORAGE_KEYS[0];
    localStorage.setItem(key, 'x');
    const payload = {
      v: 1 as const,
      exportedAt: '2026-01-01T00:00:00.000Z',
      keys: { [key]: null } as Record<string, string | null>,
    };
    applyVocabBackupToLocalStorage(payload);
    expect(localStorage.getItem(key)).toBeNull();
  });
});
