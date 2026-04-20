import { safeJsonParse } from './safeJsonParse';
import { clearStudyCursor } from './studyCursor';
import { getBeijingDateKey } from './beijingDate';
import { hasBuiltInVocabFile } from '../data/vocabBookWords';
import { clearScanResumeStorage } from './scanResumeStorage';
import { clearTodayScanForBook, getScannedWordCountOnDate, getTodayScannedWordCount } from './todayScanProgress';
import { dispatchVocabStatsUpdated } from './vocabStatsEvents';

const CHALLENGE_KEY = 'vocab_daily_challenge';

export type DailyChallengeBookState = {
  /** 当日开始扫词（成功加载一批）的日历日 YYYY-MM-DD */
  startedDate: string | null;
  /** 当日整批扫完的日历日（北京日）；通关判定见 checkCalendarRollover（可与 startedDate 不同日，如跨午夜扫完） */
  completedOnDate: string | null;
  /** 未完成当日首组扫词前最高只能选循环第 1 天；通关首组后解锁 2～5 */
  maxUnlockedCycleDay: number;
};

/** 挑战逻辑中的「日历日」一律按北京时间 */
function todayKey(): string {
  return getBeijingDateKey();
}

export function readChallengeMap(): Record<string, DailyChallengeBookState> {
  return safeJsonParse<Record<string, DailyChallengeBookState>>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(CHALLENGE_KEY) : null,
    {}
  );
}

function writeChallengeMap(map: Record<string, DailyChallengeBookState>) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(map));
  }
}

function defaultBookState(): DailyChallengeBookState {
  return { startedDate: null, completedOnDate: null, maxUnlockedCycleDay: 1 };
}

export function getBookChallenge(bookId: string): DailyChallengeBookState {
  const m = readChallengeMap();
  return m[bookId] ?? defaultBookState();
}

/** 主攻书是否已选每日词量（才启用「当日通关」规则） */
export function primaryBookHasDailyPlan(): boolean {
  const books = safeJsonParse<unknown[] | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('vocab_focus_books') : null,
    null
  );
  const w = books?.[0] && typeof books[0] === 'object' ? (books[0] as { dailyPlanWords?: unknown }).dailyPlanWords : undefined;
  return w === 150 || w === 300 || w === 1000;
}

export function getPrimaryFocusBookId(): string | null {
  const books = safeJsonParse<unknown[] | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('vocab_focus_books') : null,
    null
  );
  const id = books?.[0] && typeof books[0] === 'object' ? (books[0] as { id?: unknown }).id : undefined;
  return typeof id === 'string' ? id : null;
}

/** 若主攻书信息丢失，仍可用挑战表兜底判断“今日是否已通关” */
export function findAnyCompletedBookIdOnDate(dateKey: string): string | null {
  const m = readChallengeMap();
  for (const [bookId, state] of Object.entries(m)) {
    if (state?.completedOnDate === dateKey) return bookId;
  }
  return null;
}

function getDailyPlanWordsForBook(bookId: string): number {
  const books = safeJsonParse<unknown[] | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('vocab_focus_books') : null,
    null
  );
  if (!Array.isArray(books)) return 0;
  const b = books.find((x) => x && typeof x === 'object' && (x as { id?: unknown }).id === bookId) as
    | { dailyPlanWords?: unknown }
    | undefined;
  const w = b?.dailyPlanWords;
  if (w === 150 || w === 300 || w === 1000) return w;
  return 0;
}

/**
 * 今日「首组」扫词是否已达当日档位：优先看 completedOnDate，否则看 vocab_today_scan_batches（双写任一成功即可）。
 * 用于首屏 bootstrap，避免 completedOnDate 未落盘时误显示「去词书库选档」。
 */
export function isPrimaryFocusDailyPlanDoneToday(bookId: string | null | undefined): boolean {
  const id =
    bookId && typeof bookId === 'string' && bookId.length > 0 ? bookId : getPrimaryFocusBookId();
  if (!id) return false;
  const t = todayKey();
  if (getBookChallenge(id).completedOnDate === t) return true;
  let plan = getDailyPlanWordsForBook(id);
  if (plan <= 0 && id === getPrimaryFocusBookId()) {
    const vp = safeJsonParse<{ words?: unknown } | null>(
      typeof localStorage !== 'undefined' ? localStorage.getItem('vocab_plan') : null,
      null
    );
    const w = vp?.words;
    if (w === 150 || w === 300 || w === 1000) plan = w;
  }
  if (plan <= 0) return false;
  return getTodayScannedWordCount(id) >= plan;
}

export function getMaxUnlockedCycleDay(bookId: string | null): number {
  if (!bookId || !primaryBookHasDailyPlan()) return 5;
  const n = getBookChallenge(bookId).maxUnlockedCycleDay;
  return n >= 1 && n <= 5 ? n : 1;
}

/** 成功进入扫词页并加载一批词时调用 */
export function markChallengeStarted(bookId: string) {
  
  const m = readChallengeMap();
  const cur = m[bookId] ?? defaultBookState();
  m[bookId] = { ...cur, startedDate: todayKey() };
  writeChallengeMap(m);
  dispatchChallengeUpdated();
}

/** 当日整批词扫完（会话结束）时调用 */
export function markChallengeCompleted(bookId: string) {
  
  const m = readChallengeMap();
  const cur = m[bookId] ?? defaultBookState();
  const t = todayKey();
  m[bookId] = {
    ...cur,
    completedOnDate: t,
    maxUnlockedCycleDay: 5,
  };
  writeChallengeMap(m);
  dispatchChallengeUpdated();
}

/**
 * 仅「当日计划内首组」扫完时调用：解锁 Cycle、记通关日。
 * 同日加练的后续批次不再调用，避免与「叠加背」语义冲突。
 */
export function markPlanBatchChallengeCompletedIfNeeded(bookId: string) {
  
  const cur = getBookChallenge(bookId);
  const t = todayKey();
  if (cur.completedOnDate === t) return;
  markChallengeCompleted(bookId);
}

export type RolloverResult =
  | { type: 'none' }
  | { type: 'failure'; bookId: string }
  | { type: 'newDayAfterSuccess'; bookId: string };

/**
 * 跨日检查：未完成则挑战失败；已通关则进入下一自然日对应循环日。
 *
 * 通关判定：须有 completedOnDate，且 completedOnDate >= startedDate（YYYY-MM-DD 字符串可比）。
 * 不再要求「完成日必须等于开始日」：若用户跨午夜才扫完当日整批，或开始日与记日志的完成日不一致，
 * 热力图仍可能显示多天学习，但旧逻辑会误判失败、循环永远不前进。
 *
 * 「今天」已通关且开始日在今天之前：不重复触发 rollover（completedOnDate >= today）。
 */
/** 从 vocab_stats.history 读取指定日期已判定词数（new + 七分熟 + 全熟之和），用于第三道兜底校验 */
function getStatsDayWordCount(dateKey: string): number {
  if (typeof localStorage === 'undefined' || !dateKey) return 0;
  try {
    const s = safeJsonParse<{
      history?: Record<string, { new?: number; familiar_70?: number; familiar_100?: number }>;
    } | null>(localStorage.getItem('vocab_stats'), null);
    const d = s?.history?.[dateKey];
    if (!d || typeof d !== 'object') return 0;
    return (Number(d.new) || 0) + (Number(d.familiar_70) || 0) + (Number(d.familiar_100) || 0);
  } catch {
    return 0;
  }
}

export function checkCalendarRollover(bookId: string | null): RolloverResult {
  if (!bookId || !primaryBookHasDailyPlan()) return { type: 'none' };
  const t = todayKey();
  const cur = getBookChallenge(bookId);
  if (!cur.startedDate) return { type: 'none' };
  if (cur.startedDate >= t) return { type: 'none' };

  // 额外兜底：即便 completedOnDate 标记异常，只要 startedDate 当天扫词累计数已达到档位，
  // 就视为昨日已通关，避免误判失败并清空 vocab_stats / 词表熟度。
  const planWords = getDailyPlanWordsForBook(bookId);
  if (planWords > 0) {
    const scannedOnStartedDate = getScannedWordCountOnDate(bookId, cur.startedDate);
    if (scannedOnStartedDate >= planWords) {
      return { type: 'newDayAfterSuccess', bookId };
    }
  }

  if (!cur.completedOnDate) {
    // 兜底：若 completedOnDate 意外缺失，但 startedDate 当日累计已达档位，仍视为昨日已通关，避免误清档。
    const planWords = getDailyPlanWordsForBook(bookId);
    const scannedOnStartedDate = planWords > 0 ? getScannedWordCountOnDate(bookId, cur.startedDate) : 0;
    if (planWords > 0 && scannedOnStartedDate >= planWords) {
      return { type: 'newDayAfterSuccess', bookId };
    }
    // 第三道兜底：学习统计（vocab_stats.history）中当日已判定词数 >= 计划词数 80%，阻止误清数据
    const statsCount = planWords > 0 ? getStatsDayWordCount(cur.startedDate) : 0;
    if (planWords > 0 && statsCount >= planWords * 0.8) {
      console.warn('[DailyChallenge] vocab_stats 兜底触发：统计数据显示昨日已完成学习，阻止错误清零', {
        statsCount, planWords, startedDate: cur.startedDate,
      });
      return { type: 'newDayAfterSuccess', bookId };
    }
    return { type: 'failure', bookId };
  }
  if (cur.completedOnDate < cur.startedDate) {
    // completedOnDate 异常时同样 check 统计数据，避免极端 Bug 场景下的误清
    const pw = getDailyPlanWordsForBook(bookId);
    const statsCount2 = pw > 0 ? getStatsDayWordCount(cur.startedDate) : 0;
    if (pw > 0 && statsCount2 >= pw * 0.8) {
      console.warn('[DailyChallenge] vocab_stats 兜底触发（completedOnDate 异常）：统计显示已完成', {
        statsCount2, pw, startedDate: cur.startedDate,
      });
      return { type: 'newDayAfterSuccess', bookId };
    }
    return { type: 'failure', bookId };
  }
  if (cur.completedOnDate >= t) {
    return { type: 'none' };
  }
  return { type: 'newDayAfterSuccess', bookId };
}

/**
 * 跨日且昨日已通关：清空挑战标记。
 * @param nextCycleDay 新自然日应对应的 5 日循环日（1～5），与 App 中 `vocab_current_day` 的 +1 一致。
 * 须至少解锁到该天，否则 maxUnlocked 仍为 1 会把界面上的循环日钳回第 1 天。
 * 更高天数仍须当日完成首组扫词后才会解锁（markChallengeCompleted 会拉到 5）。
 */
export function applyNewDayAfterSuccess(bookId: string, nextCycleDay: number) {
  const m = readChallengeMap();
  const prev = m[bookId] ?? defaultBookState();
  const cap = Math.min(5, Math.max(1, Math.floor(nextCycleDay)));
  m[bookId] = {
    ...prev,
    startedDate: null,
    completedOnDate: null,
    maxUnlockedCycleDay: cap,
  };
  writeChallengeMap(m);
  clearScanResumeStorage();
  dispatchChallengeUpdated();
}

function applyFailureChallengeOnly(bookId: string) {
  const m = readChallengeMap();
  const prev = m[bookId] ?? defaultBookState();
  m[bookId] = {
    ...prev,
    startedDate: null,
    completedOnDate: null,
    maxUnlockedCycleDay: 1,
  };
  writeChallengeMap(m);
}

/**
 * 与词书库「清空进度」一致：写回三本数组里该书目的 progress / words / 立约字段。
 * 仅操作 localStorage，供跨日失败重置在 App 层调用（无 React setState 时）。
 */
function patchBooksResetProgressAndWordMarks(bookId: string) {
  if (typeof localStorage === 'undefined') return;
  const storageKeys = ['vocab_focus_books', 'vocab_collection_books', 'vocab_custom_books'] as const;
  const clearMergedWords = hasBuiltInVocabFile(bookId);
  for (const storageKey of storageKeys) {
    const list = safeJsonParse<unknown[]>(localStorage.getItem(storageKey), []);
    if (!Array.isArray(list)) continue;
    const next = list.map((raw) => {
      if (!raw || typeof raw !== 'object' || (raw as { id?: unknown }).id !== bookId) return raw;
      const b = raw as Record<string, unknown>;
      let nextWords: unknown = b.words;
      if (clearMergedWords) {
        nextWords = [];
      } else if (Array.isArray(b.words)) {
        nextWords = b.words.map((w: unknown) => {
          if (!w || typeof w !== 'object') return w;
          const wo = w as Record<string, unknown>;
          return { ...wo, status: 'new', review_count: 0, stuckCycles: 0 };
        });
      }
      return {
        ...b,
        progress: 0,
        dailyPlanWords: undefined,
        studyPass: 1,
        words: nextWords,
      };
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
}

/** 挑战失败：游标归零、学习统计清空、书进度归零、Cycle 锁回 Day1（与立约文案一致） */
export function applyDailyChallengeFailureReset(bookId: string) {
  applyFailureChallengeOnly(bookId);
  clearTodayScanForBook(bookId);
  clearStudyCursor(bookId);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('vocab_stats');
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('vocab_dictation_progress_v1_')) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    // 避免 VocabularyModule 用 plan.words 把已解除的 dailyPlanWords 又填回去（仅 150/300/1000 会回填）
    localStorage.setItem('vocab_plan', JSON.stringify({ time: 30, words: 30, day: 1 }));
    localStorage.setItem('vocab_current_day', '1');
  }
  patchBooksResetProgressAndWordMarks(bookId);
  clearScanResumeStorage();
  dispatchVocabStatsUpdated();
  dispatchChallengeUpdated();
}

export const DAILY_CHALLENGE_EVENT = 'vocab-daily-challenge-updated';

function dispatchChallengeUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DAILY_CHALLENGE_EVENT));
}
