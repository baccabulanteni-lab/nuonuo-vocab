export type EnglishAccent = 'us' | 'uk';
export type PronunciationRepeatMode = 'loop' | 'once';

const STORAGE_KEY_ACCENT = 'vocab_pronunciation_accent';
const STORAGE_KEY_ENABLED = 'vocab_pronunciation_enabled';
const STORAGE_KEY_REPEAT = 'vocab_pronunciation_repeat_mode';

export function getPronunciationAccent(): EnglishAccent {
  if (typeof localStorage === 'undefined') return 'us';
  try {
    const v = localStorage.getItem(STORAGE_KEY_ACCENT);
    if (v === 'uk' || v === 'us') return v;
  } catch { /* ignore */ }
  return 'us';
}

export function setPronunciationAccent(accent: EnglishAccent): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACCENT, accent);
  } catch { /* ignore */ }
}

export function getPronunciationEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    const v = localStorage.getItem(STORAGE_KEY_ENABLED);
    if (v === 'false') return false;
  } catch { /* ignore */ }
  return true;
}

export function setPronunciationEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
  } catch { /* ignore */ }
}

export function getPronunciationRepeatMode(): PronunciationRepeatMode {
  if (typeof localStorage === 'undefined') return 'loop';
  try {
    const v = localStorage.getItem(STORAGE_KEY_REPEAT);
    if (v === 'once' || v === 'loop') return v;
  } catch { /* ignore */ }
  return 'loop';
}

export function setPronunciationRepeatMode(mode: PronunciationRepeatMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_REPEAT, mode);
  } catch { /* ignore */ }
}
