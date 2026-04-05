import { safeJsonParse } from './safeJsonParse';

export const STUDY_CURSOR_STORAGE_KEY = 'vocab_book_study_cursor';

export function readStudyCursorMap(): Record<string, number> {
  return safeJsonParse<Record<string, number>>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(STUDY_CURSOR_STORAGE_KEY) : null,
    {}
  );
}

export function getStudyCursor(bookId: string): number {
  return readStudyCursorMap()[bookId] ?? 0;
}

export function setStudyCursor(bookId: string, offset: number) {
  const m = readStudyCursorMap();
  m[bookId] = offset;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STUDY_CURSOR_STORAGE_KEY, JSON.stringify(m));
  }
}

export function clearStudyCursor(bookId: string) {
  const m = readStudyCursorMap();
  delete m[bookId];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STUDY_CURSOR_STORAGE_KEY, JSON.stringify(m));
  }
}
