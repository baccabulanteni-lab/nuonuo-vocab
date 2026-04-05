import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from './UI';
import { loadRawCorpusForBook } from '../utils/loadBookCorpus';
import { buildStudyQueueForPass, getEffectiveStudyPass } from '../utils/studyPassQueue';
import { buildCycleBatchesFromQueue } from '../utils/wordCycleSchedule';
import { estimateFirstPassNodesAndDays } from '../utils/vocabularyModuleHelpers';
import type { Word } from '../types/vocabularyWord';
import type { DailyPlanWords } from '../utils/scanResumeSession';

type BookLike = {
  id: string;
  words?: Word[];
  studyPass?: number;
  count?: number;
};

export function BookCycleSchedulePreview({
  book,
  dailyPlanWords,
  variant = 'card',
}: {
  book: BookLike;
  dailyPlanWords: DailyPlanWords;
  /** sheet：嵌入弹层，去掉外框与重复标题 */
  variant?: 'card' | 'sheet';
}) {
  const [batchIdx, setBatchIdx] = useState(0);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof loadRawCorpusForBook>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pass = getEffectiveStudyPass(book);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBatchIdx(0);
    void (async () => {
      try {
        const raw = await loadRawCorpusForBook(book);
        if (cancelled) return;
        const q = buildStudyQueueForPass(raw, book.words, pass, book.id);
        setQueue(q);
      } catch {
        if (!cancelled) setError('词表加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book.id, book.words, pass]);

  const batches = useMemo(
    () => buildCycleBatchesFromQueue(queue, dailyPlanWords),
    [queue, dailyPlanWords]
  );

  useEffect(() => {
    if (batchIdx >= batches.length) setBatchIdx(Math.max(0, batches.length - 1));
  }, [batches.length, batchIdx]);

  const current = batches[batchIdx];
  const est = estimateFirstPassNodesAndDays(queue.length, dailyPlanWords);

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 py-6 text-xs text-[#8c8881]',
          variant === 'card' && 'rounded-xl border border-[#e8dfd0] bg-[#fdfaf5]/90 px-4'
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        正在按本书队列加载分配预览…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'py-3 text-xs text-red-900/90',
          variant === 'card' && 'rounded-xl border border-red-200/80 bg-red-50/80 px-4'
        )}
      >
        {error}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div
        className={cn(
          'py-3 text-xs text-[#8c8881]',
          variant === 'card' && 'rounded-xl border border-[#e8dfd0] bg-[#faf7f2]/90 px-4'
        )}
      >
        暂无可用词表，无法预览循环分配。
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const totalBatches = batches.length;

  return (
    <div
      className={cn(
        'space-y-3',
        variant === 'card' && 'rounded-xl border border-[#d4c4b0]/55 bg-[#fdfaf5]/95 px-4 py-4 md:px-5 md:py-5'
      )}
    >
      <div className="space-y-1.5">
        {variant === 'card' ? (
          <h4 className="text-xs md:text-sm font-serif font-bold text-[#2c2417] tracking-wide">
            词表 × 5 日循环分配
          </h4>
        ) : null}
        <p className="text-[10px] md:text-[11px] leading-relaxed text-[#6b5b4d]">
          下列顺序与「今日扫词」当前轮队列一致（第 {pass} 轮
          {pass === 1 ? '，全书顺序' : '，未全熟词重排'}）。每批 {dailyPlanWords}{' '}
          词：偶数批在<strong className="font-semibold text-[#5c4030]">循环第 1 日</strong>首次新学（Part A），奇数批在
          <strong className="font-semibold text-[#5c4030]">循环第 3 日</strong>首次新学（Part B）；分别在第 2 / 4 日做对应复习；第 5
          日合并两批未全熟进入大复习（与 App 内引擎一致）。
        </p>
        <p className="text-[10px] text-[#7a6a58] leading-relaxed">
          本书当前队列共 <span className="tabular-nums font-semibold text-[#3d3428]">{queue.length.toLocaleString()}</span>{' '}
          词
          {typeof book.count === 'number' && book.count !== queue.length ? (
            <span className="tabular-nums">（书目总词 {book.count.toLocaleString()}，轮次与熟度会影响队列长度）</span>
          ) : null}
          ；第一轮（破冰）粗算约 <span className="tabular-nums font-semibold">{est.daysMin}</span> 个自然日、
          <span className="tabular-nums font-semibold">{est.nodes}</span> 个 5 日节点。全书通关后进入下一轮，仍按同一批大小与循环日规则，仅词集合变为当时未全熟词。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#e8dfd0] pt-3">
        <button
          type="button"
          aria-label="上一批"
          disabled={batchIdx <= 0}
          onClick={() => setBatchIdx((i) => Math.max(0, i - 1))}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#c4a574]/45 bg-white/80 text-[#5c4030] shadow-sm transition-colors',
            batchIdx <= 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#fff9f0] active:scale-[0.98]'
          )}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="flex-1 min-w-0 text-center md:text-left">
          <p className="text-[11px] md:text-xs font-bold text-[#1f1e1d] tabular-nums">
            第 {batchIdx + 1} / {totalBatches} 批
          </p>
          <p className="text-[10px] text-[#7a6a58] mt-0.5 leading-snug">
            所属 5 日节点：第 {current.fiveDayNodeIndex1} 个 · Part {current.part} · 首次新学{' '}
            <span className="tabular-nums">循环第 {current.introCycleDay} 日</span>
            ，复习{' '}
            <span className="tabular-nums">循环第 {current.reviewCycleDay} 日</span>
          </p>
        </div>
        <button
          type="button"
          aria-label="下一批"
          disabled={batchIdx >= totalBatches - 1}
          onClick={() => setBatchIdx((i) => Math.min(totalBatches - 1, i + 1))}
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#c4a574]/45 bg-white/80 text-[#5c4030] shadow-sm transition-colors',
            batchIdx >= totalBatches - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#fff9f0] active:scale-[0.98]'
          )}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          'overflow-y-auto rounded-lg border border-[#e8dfd0] bg-white/70 px-3 py-2.5',
          variant === 'sheet' ? 'max-h-[42dvh] md:max-h-[18rem]' : 'max-h-[40vh] md:max-h-[16rem]'
        )}
        role="list"
        aria-label="本批单词"
      >
        <ul className="space-y-1.5">
          {current.items.map((w, i) => (
            <li
              key={w.id}
              role="listitem"
              className="flex gap-2 text-[11px] md:text-xs text-[#2c2417] leading-snug border-b border-[#f0ebe3] last:border-0 pb-1.5 last:pb-0"
            >
              <span className="tabular-nums text-[#a8a29a] w-7 shrink-0">{batchIdx * dailyPlanWords + i + 1}</span>
              <span className="font-medium shrink-0 min-w-[4.5rem]">{w.word}</span>
              {w.meaning ? (
                <span className="text-[#6b5b4d] line-clamp-2 break-words">{w.meaning}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
