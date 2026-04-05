import { useLayoutEffect, useRef, type MutableRefObject } from 'react';
import {
  hasBuiltInVocabFile,
  type BookWordPreview,
} from '../data/vocabBookWords';
import { fetchBuiltInCorpusCached } from '../utils/vocabCorpusCache';
import { getStudyCursor, setStudyCursor } from '../utils/studyCursor';
import {
  getPrimaryFocusBookId,
  isPrimaryFocusDailyPlanDoneToday,
  markChallengeStarted,
  markPlanBatchChallengeCompletedIfNeeded,
} from '../utils/dailyChallenge';
import { getBeijingDateKey } from '../utils/beijingDate';
import {
  clearScanResumeStorage,
  readScanResumeFromStorage,
  writeScanResumeToStorage,
} from '../utils/scanResumeStorage';
import { scanResumeMatchesSession, type DailyPlanWords } from '../utils/scanResumeSession';
import { canonicalCycleDayLabel } from '../utils/cycleDayLabel';
import { buildStudyQueueForPass, getEffectiveStudyPass } from '../utils/studyPassQueue';
import type { Word, WordStatus, ModuleMode } from '../types/vocabularyWord';

type ViewState = 'scanning' | 'finished';

function normalizeDailyPlanWords(w: unknown): DailyPlanWords | null {
  const n = typeof w === 'string' ? parseInt(w, 10) : w;
  if (n === 150 || n === 300 || n === 1000) return n;
  return null;
}

export type ScanBootstrapFocusBook = {
  id: string;
  dailyPlanWords?: DailyPlanWords;
  /** 学习轮次，从 1 计；第 2 轮起为未全熟词重排 */
  studyPass?: number;
  words?: Word[];
};

export type ScanCorpusBootstrapConfig = {
  /** false 时勿扫词：主攻书尚未从 IDB/localStorage 载入，避免误报「未选每日词量」 */
  isStorageReady: boolean;
  focusBook: ScanBootstrapFocusBook | undefined;
  currentDay: number;
  activeMode: ModuleMode;
  viewState: ViewState;
  corpusBatch: Word[] | null;
  scanSessionTrigger: number;
  setCorpusBatch: (batch: Word[] | null) => void;
  setCurrentIndex: (n: number | ((prev: number) => number)) => void;
  setViewState: (v: ViewState) => void;
  setIntroScanLoading: (v: boolean) => void;
  setFeedback: (msg: string | null) => void;
  scanSessionOutcomeRef: MutableRefObject<{
    new: number;
    familiar_70: number;
    familiar_100: number;
  }>;
  sessionStartCursorRef: MutableRefObject<number>;
  corpusLoadIntentRef: MutableRefObject<'resume' | 'fresh' | null>;
  pendingResumeIndexRef: MutableRefObject<number | null>;
  scanMergeWordsRef: MutableRefObject<Word[]>;
  setFinishedScanSummary: (s: { new: number; familiar_70: number; familiar_100: number } | null) => void;
  setScanFinishedReason: (r: 'batch' | 'dailyPlanDone' | null) => void;
};

/**
 * 扫词首页：无 corpus 时自动 beginScanFromIntro（续学或拉取新批）。
 * 状态机与 ref 由调用方持有，本 hook 只编排副作用与异步加载。
 */
export function useScanCorpusBootstrap(config: ScanCorpusBootstrapConfig) {
  const autoScanLoadRef = useRef(false);

  useLayoutEffect(() => {
    if (!config.isStorageReady) return;
    // 允许在 scan 或 review 模式下进入加载逻辑
    if ((config.activeMode !== 'scan' && config.activeMode !== 'review') || config.viewState === 'finished') return;
    if (config.corpusBatch !== null) return;
    if (autoScanLoadRef.current) return;
    autoScanLoadRef.current = true;

    let cancelled = false;

    const beginScanFromIntro = async () => {
      const p = config;
      const book = p.focusBook;
      if (cancelled) return;
      p.setIntroScanLoading(true);
      // 必须在 dailyPlanWords 就绪前判断：首帧 focus 可能尚未回填档位，否则会误提示「去词书库选档」且永远进不了完成页。
      const canonicalBookId = book?.id ?? getPrimaryFocusBookId();
      if (canonicalBookId && isPrimaryFocusDailyPlanDoneToday(canonicalBookId)) {
        markPlanBatchChallengeCompletedIfNeeded(canonicalBookId);
        if (cancelled) return;
        clearScanResumeStorage();
        p.setScanFinishedReason('dailyPlanDone');
        p.setFinishedScanSummary({ new: 0, familiar_70: 0, familiar_100: 0 });
        p.setViewState('finished');
        p.setIntroScanLoading(false);
        return;
      }
      const dailyNorm = book ? normalizeDailyPlanWords(book.dailyPlanWords) : null;
      if (!book?.id || dailyNorm == null) {
        p.setFeedback('请先在「备考词书库」点开本书，选择每日 150 / 300 / 1000 词');
        setTimeout(() => p.setFeedback(null), 2800);
        p.setIntroScanLoading(false);
        return;
      }
      try {
        const daily = dailyNorm;
        const rawOffset = getStudyCursor(book.id);
        // A/B 双槽位对齐：Day1 只取 A 槽(偶批)，Day3 只取 B 槽(奇批)。
        // 若游标错位，会出现「Day1 打开却是 Day3 词」的串词现象，这里做纠偏。
        let offset = rawOffset;
        const batchIndex = Math.floor(offset / daily);
        if (p.currentDay === 1 && batchIndex % 2 === 1) {
          offset = Math.max(0, offset - daily);
          setStudyCursor(book.id, offset);
        } else if (p.currentDay === 3 && batchIndex % 2 === 0) {
          offset = offset + daily;
          setStudyCursor(book.id, offset);
        }

        const resumeRaw = readScanResumeFromStorage();
        const passNow = getEffectiveStudyPass(book);
        const resume =
          resumeRaw &&
          scanResumeMatchesSession(
            resumeRaw,
            book.id,
            daily,
            getBeijingDateKey(),
            passNow,
            p.currentDay
          )
            ? resumeRaw
            : null;

        if (resume) {
          const doneCount =
            (resume.outcomes?.new ?? 0) +
            (resume.outcomes?.familiar_70 ?? 0) +
            (resume.outcomes?.familiar_100 ?? 0);
          if (doneCount >= resume.words.length && resume.words.length > 0) {
            clearScanResumeStorage();
            p.setScanFinishedReason('batch');
            p.setFinishedScanSummary({
              new: resume.outcomes?.new ?? 0,
              familiar_70: resume.outcomes?.familiar_70 ?? 0,
              familiar_100: resume.outcomes?.familiar_100 ?? 0,
            });
            p.setViewState('finished');
            p.setIntroScanLoading(false);
            return;
          }
          p.scanSessionOutcomeRef.current = { ...resume.outcomes };
          p.sessionStartCursorRef.current = resume.cursorAtSessionStart;
          p.corpusLoadIntentRef.current = 'resume';
          const dayTag = `Day ${p.currentDay}`;
          const normalizedWords = (resume.words as Word[]).map((w) => ({
            ...w,
            addedOn: canonicalCycleDayLabel(w.addedOn) ?? dayTag,
          }));
          const maxIdx = Math.max(0, normalizedWords.length - 1);
          const safeIdx = Math.min(Math.max(0, resume.currentIndex), maxIdx);
          p.pendingResumeIndexRef.current = safeIdx;
          p.setCurrentIndex(safeIdx);
          p.setCorpusBatch(normalizedWords);
          markChallengeStarted(book.id);
          p.setViewState('scanning');
          return;
        }

        let raw: BookWordPreview[] = [];
        if (hasBuiltInVocabFile(book.id)) {
          raw = await fetchBuiltInCorpusCached(book.id);
          if (cancelled) return;
        } else if (book.words && book.words.length > 0) {
          raw = book.words.map((w: Word) => ({
            id: w.id,
            word: w.word,
            meaning: w.meaning,
            phonetic: w.phonetic || '',
          }));
        } else {
          p.setFeedback('当前书目没有可加载的词表，请导入或更换主攻书');
          p.setIntroScanLoading(false);
          return;
        }
        const pass = getEffectiveStudyPass(book);
        const queue = buildStudyQueueForPass(raw, book.words, pass, book.id);
        const total = queue.length;
        const bwMap = new Map((book.words || []).map((w) => [w.id, w]));

        if (pass <= 1 && (p.currentDay === 1 || p.currentDay === 3) && daily > 0) {
          const maxBatchHops = Math.max(1, Math.ceil(total / daily));
          let hops = 0;
          const isWrongDayWord = (id: string) => {
            const prev = bwMap.get(id) as Word | undefined;
            if (!prev?.addedOn) return false;
            if (p.currentDay === 1) return prev.addedOn === 'Day 3';
            return prev.addedOn === 'Day 1';
          };
          while (offset < total && hops < maxBatchHops) {
            const candidate = queue.slice(offset, offset + daily);
            if (candidate.length === 0) break;
            if (!candidate.some((w) => isWrongDayWord(w.id))) break;
            offset += daily;
            hops += 1;
          }
          if (offset !== rawOffset) {
            setStudyCursor(book.id, offset);
          }
        }

        if (total === 0) {
          p.setFeedback(
            pass <= 1
              ? '本书词表为空或无法加载。'
              : '当前轮已无未全熟词，或请先完成上一轮。'
          );
          p.setIntroScanLoading(false);
          return;
        }
        if (offset >= total && p.activeMode === 'scan') {
          p.setFeedback(
            pass <= 1
              ? '本书词表已全部过完，可在词库调整或更换书目'
              : '本轮词队列已学完，请从完成页返回或择日再扫。'
          );
          p.setIntroScanLoading(false);
          return;
        }

        const part = p.currentDay === 3 ? 'B' : 'A';
        const slice = queue.slice(offset, offset + daily);
        const words: Word[] = slice.map((w) => {
          const prev = bwMap.get(w.id);
          return {
            id: w.id,
            word: w.word,
            meaning: w.meaning,
            phonetic: w.phonetic || '',
            status: ((prev?.status as WordStatus) ?? 'new') as WordStatus,
            review_count: prev?.review_count ?? 0,
            part,
            addedOn: `Day ${p.currentDay}`,
          };
        });
        p.sessionStartCursorRef.current = offset;
        p.scanSessionOutcomeRef.current = { new: 0, familiar_70: 0, familiar_100: 0 };
        clearScanResumeStorage();
        p.corpusLoadIntentRef.current = 'fresh';
        p.setCorpusBatch(words);
        const initSnap = words.map((w) => ({ ...w }));
        p.scanMergeWordsRef.current = initSnap;
        writeScanResumeToStorage({
          v: 1,
          bookId: book.id,
          calendarDate: getBeijingDateKey(),
          cycleDay: p.currentDay,
          cursorAtSessionStart: offset,
          dailyPlanWords: daily,
          studyPass: pass,
          currentIndex: 0,
          words: initSnap,
          outcomes: { ...p.scanSessionOutcomeRef.current },
        });
        markChallengeStarted(book.id);
        p.setViewState('scanning');
      } catch {
        p.setFeedback('词表加载失败，请确认已执行导入且 public/vocab 齐全');
        setTimeout(() => p.setFeedback(null), 2800);
      } finally {
        p.setIntroScanLoading(false);
      }
    };

    void beginScanFromIntro().finally(() => {
      if (!cancelled) autoScanLoadRef.current = false;
    });

    return () => {
      cancelled = true;
      autoScanLoadRef.current = false;
    };
  }, [
    config.isStorageReady,
    config.activeMode,
    config.viewState,
    config.currentDay,
    config.focusBook?.id,
    config.focusBook?.dailyPlanWords,
    config.focusBook?.studyPass,
    config.scanSessionTrigger,
    config.corpusBatch,
  ]);
}
