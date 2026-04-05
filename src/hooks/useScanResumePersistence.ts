import { useEffect, type MutableRefObject } from 'react';
import { getBeijingDateKey } from '../utils/beijingDate';
import { writeScanResumeToStorage } from '../utils/scanResumeStorage';
import type { DailyPlanWords } from '../utils/scanResumeSession';
import type { Word, ModuleMode } from '../types/vocabularyWord';

type ViewState = 'scanning' | 'finished';

export type ScanResumePersistenceConfig = {
  activeMode: ModuleMode;
  viewState: ViewState;
  corpusBatch: Word[] | null;
  currentIndex: number;
  currentDay: number;
  focusBook: { id: string; dailyPlanWords?: DailyPlanWords } | undefined;
  scanMergeWordsRef: MutableRefObject<Word[]>;
  sessionStartCursorRef: MutableRefObject<number>;
  scanSessionOutcomeRef: MutableRefObject<{
    new: number;
    familiar_70: number;
    familiar_100: number;
  }>;
};

function wordsSnapshot(
  corpusBatch: Word[],
  scanMergeWordsRef: MutableRefObject<Word[]>
): Word[] {
  return scanMergeWordsRef.current.length === corpusBatch.length
    ? scanMergeWordsRef.current.map((w) => ({ ...w }))
    : corpusBatch.map((w) => ({ ...w }));
}

function writeResumeSnapshot(config: ScanResumePersistenceConfig) {
  const book = config.focusBook;
  if (!book?.dailyPlanWords || config.corpusBatch === null) return;
  const words = wordsSnapshot(config.corpusBatch, config.scanMergeWordsRef);
  const maxIdx = Math.max(0, words.length - 1);
  const safeIndex = Math.min(Math.max(0, config.currentIndex), maxIdx);
  writeScanResumeToStorage({
    v: 1,
    bookId: book.id,
    calendarDate: getBeijingDateKey(),
    cycleDay: config.currentDay,
    cursorAtSessionStart: config.sessionStartCursorRef.current,
    dailyPlanWords: book.dailyPlanWords,
    currentIndex: safeIndex,
    words,
    outcomes: { ...config.scanSessionOutcomeRef.current },
  });
}

/**
 * 扫词进行中：把当前批进度写入续学快照（被动 effect + 切后台 / 关页时再刷一次）。
 */
export function useScanResumePersistence({
  activeMode,
  viewState,
  corpusBatch,
  currentIndex,
  currentDay,
  focusBook,
  scanMergeWordsRef,
  sessionStartCursorRef,
  scanSessionOutcomeRef,
}: ScanResumePersistenceConfig) {
  useEffect(() => {
    if (corpusBatch === null || activeMode !== 'scan' || viewState !== 'scanning') return;
    if (!focusBook?.dailyPlanWords) return;
    writeResumeSnapshot({
      activeMode,
      viewState,
      corpusBatch,
      currentIndex,
      currentDay,
      focusBook,
      scanMergeWordsRef,
      sessionStartCursorRef,
      scanSessionOutcomeRef,
    });
  }, [
    activeMode,
    viewState,
    corpusBatch,
    currentIndex,
    currentDay,
    focusBook?.id,
    focusBook?.dailyPlanWords,
  ]);

  useEffect(() => {
    if (corpusBatch === null || activeMode !== 'scan' || viewState !== 'scanning') return;
    if (!focusBook?.dailyPlanWords) return;
    const persist = () => {
      writeResumeSnapshot({
        activeMode,
        viewState,
        corpusBatch,
        currentIndex,
        currentDay,
        focusBook,
        scanMergeWordsRef,
        sessionStartCursorRef,
        scanSessionOutcomeRef,
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', persist);
    window.addEventListener('beforeunload', persist);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', persist);
      window.removeEventListener('beforeunload', persist);
      persist();
    };
  }, [
    activeMode,
    viewState,
    corpusBatch,
    currentIndex,
    currentDay,
    focusBook?.id,
    focusBook?.dailyPlanWords,
  ]);
}
