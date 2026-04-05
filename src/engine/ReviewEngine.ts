/**
 * 艾宾浩斯 5 日循环调度引擎（纯数据层，无 UI）
 */

export type CycleDay = 1 | 2 | 3 | 4 | 5;

export type ReviewBatchId = 'Part_A' | 'Part_B';

/** 与引擎配套的熟度状态 */
export type ReviewWordStatus = 'RAW' | 'MEDIUM' | 'DONE';

/**
 * 单词数据模型（引擎所需核心字段；业务层可扩展 Omit + 交叉类型）
 */
export interface ReviewEngineWord {
  id: string;
  batchId: ReviewBatchId;
  status: ReviewWordStatus;
  reviewCount: number;
}

export interface DailyTaskQueues {
  /** 初次学习队列（扫新词 / 第一遍） */
  initialLearn: ReviewEngineWord[];
  /** 循环复习队列（倒计时复习） */
  cycleReview: ReviewEngineWord[];
}

function assertCycleDay(day: number): asserts day is CycleDay {
  if (day !== 1 && day !== 2 && day !== 3 && day !== 4 && day !== 5) {
    throw new RangeError(`currentCycleDay must be 1–5, got ${day}`);
  }
}

/** 「新词」：尚未进入复习计数的首扫对象 */
function isCycleNewWord(w: ReviewEngineWord): boolean {
  return w.status === 'RAW' && w.reviewCount === 0;
}

/** 「旧词」：已非首扫、仍需纳入循环复习（不含 DONE） */
function isCycleOldWord(w: ReviewEngineWord): boolean {
  return w.status !== 'DONE' && !isCycleNewWord(w);
}

/**
 * 日程分发器：按周期第几天，从全量词表中拆出两大队列。
 */
export function generateTasksForDay(
  words: readonly ReviewEngineWord[],
  currentCycleDay: CycleDay
): DailyTaskQueues {
  assertCycleDay(currentCycleDay);

  const initialLearn: ReviewEngineWord[] = [];
  const cycleReview: ReviewEngineWord[] = [];

  if (currentCycleDay === 1) {
    for (const w of words) {
      if (w.batchId === 'Part_A' && isCycleNewWord(w)) initialLearn.push(w);
    }
    return { initialLearn, cycleReview };
  }

  if (currentCycleDay === 2) {
    for (const w of words) {
      if (w.batchId === 'Part_A' && isCycleOldWord(w)) cycleReview.push(w);
    }
    return { initialLearn, cycleReview };
  }

  if (currentCycleDay === 3) {
    for (const w of words) {
      if (w.batchId === 'Part_B' && isCycleNewWord(w)) initialLearn.push(w);
    }
    return { initialLearn, cycleReview };
  }

  if (currentCycleDay === 4) {
    for (const w of words) {
      if (w.batchId === 'Part_B' && isCycleOldWord(w)) cycleReview.push(w);
    }
    return { initialLearn, cycleReview };
  }

  // Day 5：停止新词，仅合并两批未 DONE 进入循环复习
  for (const w of words) {
    if (
      (w.batchId === 'Part_A' || w.batchId === 'Part_B') &&
      w.status !== 'DONE'
    ) {
      cycleReview.push(w);
    }
  }
  return { initialLearn, cycleReview };
}

/**
 * 倒计时（秒）：依据熟度；生词 10s、七分熟 2s（第 5 日与第 1–4 日相同）。
 * DONE 不适用复习倒计时，规约为 0。
 */
export function getTimerDuration(
  status: ReviewWordStatus,
  currentCycleDay: CycleDay
): number {
  assertCycleDay(currentCycleDay);
  if (status === 'DONE') return 0;
  if (status === 'RAW') return 10;
  if (status === 'MEDIUM') return 2;
  return 0;
}

/**
 * 静默结算：完成一次「循环复习」倒计时后的状态推进（不可变，返回新对象）。
 * 若需原地修改，可将返回值写回数组元素或自行展开赋值。
 */
export function processReviewComplete(word: ReviewEngineWord): ReviewEngineWord {
  let reviewCount = word.reviewCount + 1;
  let status = word.status;

  if (status === 'RAW' && reviewCount >= 5) {
    status = 'MEDIUM';
  }
  if (status === 'MEDIUM' && reviewCount >= 8) {
    status = 'DONE';
  }

  return { ...word, status, reviewCount };
}

/** 原地更新（与 processReviewComplete 语义一致） */
export function processReviewCompleteInPlace(word: ReviewEngineWord): void {
  word.reviewCount += 1;
  if (word.status === 'RAW' && word.reviewCount >= 5) {
    word.status = 'MEDIUM';
  }
  if (word.status === 'MEDIUM' && word.reviewCount >= 8) {
    word.status = 'DONE';
  }
}
