export type WordStatus = 'new' | 'familiar_70' | 'familiar_100';

export type ModuleMode = 'scan' | 'review' | 'library' | 'stats' | 'dictation';

export interface Word {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
  status?: WordStatus;
  review_count?: number;
  part?: string; // To track which part (A, B, etc.) it belongs to
  stuckCycles?: number; // Track how many cycles a word stays in MEDIUM
  addedOn?: string; // e.g., "Day 1", "Day 2"
  /** 默写全表等场景：来源词书 id */
  bookId?: string;
}
