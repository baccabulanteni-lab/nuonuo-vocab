import { safeJsonParse } from './safeJsonParse';
import type { DailyPlanWords } from './scanResumeSession';
import { dispatchVocabStorageQuota } from './vocabStorageEvents';

/** 扫词中途续学快照的 localStorage key */
export const SCAN_RESUME_STORAGE_KEY = 'vocab_scan_resume';

export type ScanResumeOutcomes = {
  new: number;
  familiar_70: number;
  familiar_100: number;
};

/** 与 localStorage 中 vocab_scan_resume 结构一致（words 反序列化为 unknown[]，使用前在 UI 层断言） */
export type ScanResumePayloadV1 = {
  v: 1;
  bookId: string;
  calendarDate: string;
  cycleDay: number;
  cursorAtSessionStart: number;
  dailyPlanWords: DailyPlanWords;
  /** 与主攻书 studyPass 对齐；缺省按 1 */
  studyPass?: number;
  currentIndex: number;
  words: unknown[];
  outcomes: ScanResumeOutcomes;
};

export function clearScanResumeStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SCAN_RESUME_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function readScanResumeFromStorage(): ScanResumePayloadV1 | null {
  const x = safeJsonParse<ScanResumePayloadV1 | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(SCAN_RESUME_STORAGE_KEY) : null,
    null
  );
  if (!x || x.v !== 1 || !Array.isArray(x.words)) return null;
  return x;
}

export function writeScanResumeToStorage(p: ScanResumePayloadV1) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SCAN_RESUME_STORAGE_KEY, JSON.stringify(p));
    }
  } catch {
    dispatchVocabStorageQuota();
  }
}
