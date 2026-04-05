import { getBeijingDateKey } from './beijingDate';

export type DailyPlanWords = 150 | 300 | 1000;

/** 与 localStorage 扫词续学快照字段一致的最小结构（用于校验） */
export type ScanResumeLike = {
  bookId: string;
  calendarDate: string;
  cycleDay?: number;
  dailyPlanWords: DailyPlanWords;
  studyPass?: number;
  currentIndex: number;
  words: unknown[];
};

/**
 * 同一天、同一书、同一每日词量、同一轮次即可续学；不要求游标与 Cycle 天与快照一致。
 * @param today 可注入，供单元测试
 */
export function scanResumeMatchesSession(
  r: ScanResumeLike,
  bookId: string,
  daily: DailyPlanWords,
  today: string = getBeijingDateKey(),
  bookStudyPass: number = 1,
  cycleDay: number = 1
): boolean {
  const rp = r.studyPass ?? 1;
  const rc = typeof r.cycleDay === 'number' ? Math.floor(r.cycleDay) : 1;
  return (
    r.bookId === bookId &&
    r.calendarDate === today &&
    rc === cycleDay &&
    r.dailyPlanWords === daily &&
    rp === bookStudyPass &&
    r.currentIndex >= 0 &&
    r.currentIndex < r.words.length &&
    r.words.length > 0
  );
}
