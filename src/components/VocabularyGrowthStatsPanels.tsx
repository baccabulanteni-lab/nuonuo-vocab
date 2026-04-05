import { useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from './UI';
import { Check, Zap, ChevronRight, Flame, Trophy } from 'lucide-react';
import {
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { getBeijingDateKey, addBeijingCalendarDays } from '../utils/beijingDate';
import type { WordStatus } from '../types/vocabularyWord';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const actual = payload.find((p: any) => p?.dataKey === 'actual');
    const natural = payload.find((p: any) => p?.dataKey === 'natural');
    const day = payload[0]?.payload?.day ?? '';
    const dateLabel = payload[0]?.payload?.dateLabel ?? '';
    return (
      <div className="bg-white/90 backdrop-blur-md border border-black/5 p-3 shadow-2xl rounded-xl">
        <p className="text-[10px] font-bold text-[#1f1e1d] mb-1 uppercase tracking-widest">
          {day} <span className="text-[#8c8881] normal-case tracking-normal">({dateLabel})</span>
        </p>
        <div className="space-y-1">
          <p className="text-[11px] text-[#b58362] flex justify-between gap-4">
            <span>记忆留存:</span>
            <span className="font-bold">{actual?.value ?? 0}%</span>
          </p>
          <p className="text-[11px] text-[#8c8881] flex justify-between gap-4">
            <span>自然遗忘:</span>
            <span className="font-bold">{natural?.value ?? 0}%</span>
          </p>
        </div>
        {payload[0].payload.label && (
          <p className="mt-2 text-[9px] text-[#b58362] italic border-t border-black/5 pt-1">
            {payload[0].payload.label}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const MasteryProgress = ({
  totalMastered,
  totalScanned,
  target = 100,
  remaining,
  dailyPace,
  estimatedDays,
  mini = false,
}: {
  totalMastered: number;
  totalScanned: number;
  target?: number;
  remaining: number;
  dailyPace: number;
  estimatedDays: number;
  mini?: boolean;
}) => {
  const masteredProgress = Math.min(100, (totalMastered / (target || 1)) * 100);
  const scannedProgress = Math.min(100, (totalScanned / (target || 1)) * 100);

  if (mini) {
    return (
      <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 pl-4 rounded-3xl border border-black/5 shadow-sm">
        <div className="flex flex-col text-right">
          <div className="text-[10px] font-serif font-black text-[#1f1e1d] leading-none">{Math.round(masteredProgress)}%</div>
          <div className="text-[7px] text-[#8c8881] uppercase tracking-tighter mt-0.5">Done</div>
        </div>
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-black/5" />
            <motion.circle
              cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent"
              strokeDasharray={113}
              initial={{ strokeDashoffset: 113 }}
              animate={{ strokeDashoffset: 113 - (113 * masteredProgress) / 100 }}
              transition={{ duration: 1.5, ease: 'circOut' }}
              className="text-[#b58362]"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
      <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full md:w-auto">
        <div className="text-center md:text-right flex-1">
          <div className="text-[10px] text-[#8c8881] tracking-widest uppercase font-medium">全局通关阵列 / Global Mastery Array</div>
          <div className="text-xl md:text-2xl font-serif font-bold text-[#1f1e1d]">
            还差 <span className="text-[#b58362]">{remaining}</span> 词蜕变
          </div>
          <div className="text-[9px] text-[#C85A5A] font-bold italic mt-1 tracking-tighter max-w-[200px] md:max-w-none mx-auto md:mx-0">
            {dailyPace > 0
              ? `配速约 ${dailyPace} 词/天，按当前目标粗算约 ${estimatedDays} 天可消化剩余量（仅供参考）`
              : '正在学习以估算剩余天数（继续划词后自动更新）'}
          </div>
        </div>

        <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="transparent" stroke="#00000008" strokeWidth="4" />
            <motion.circle
              cx="32" cy="32" r="28" fill="transparent" stroke="#1a1a1a" strokeWidth="4"
              strokeDasharray={176}
              initial={{ strokeDashoffset: 176 }}
              animate={{ strokeDashoffset: 176 - (176 * scannedProgress) / 100 }}
              transition={{ duration: 1.5, ease: 'circOut' }}
              strokeLinecap="round"
            />
            <motion.circle
              cx="32" cy="32" r="22" fill="transparent" stroke="#b58362" strokeWidth="4"
              strokeDasharray={138}
              initial={{ strokeDashoffset: 138 }}
              animate={{ strokeDashoffset: 138 - (138 * masteredProgress) / 100 }}
              transition={{ duration: 1.8, ease: 'circOut', delay: 0.2 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col leading-none">
            <span className="text-[10px] md:text-xs font-bold text-[#1f1e1d]">{Math.round(masteredProgress)}%</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-[7px] md:text-[9px] uppercase tracking-widest font-bold">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
          <span className="text-gray-400">已扫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#b58362]" />
          <span className="text-[#b58362]">全熟</span>
        </div>
      </div>
    </div>
  );
};

export const TodaySettlementStamp = ({
  isComplete = false,
  className,
}: {
  isComplete?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'relative w-full aspect-square max-h-[200px] md:max-h-none md:aspect-square flex items-center justify-center overflow-hidden rounded-3xl bg-white/40 border border-black/5',
        className
      )}
    >
      <div className="absolute top-2 left-2 text-[8px] text-[#8c8881] font-bold uppercase tracking-widest">今日清算戳</div>

      <motion.div
        initial={{ scale: 2, opacity: 0, rotate: -20 }}
        animate={{ scale: 1, opacity: 1, rotate: -12 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.5 }}
        className={cn(
          'px-6 py-3 border-4 rounded-xl flex flex-col items-center justify-center gap-1',
          isComplete
            ? 'border-[#b58362] text-[#b58362] bg-[#b58362]/5'
            : 'border-gray-300 text-gray-300 bg-gray-50/50'
        )}
      >
        <div className="text-xl font-display font-black tracking-tighter">
          {isComplete ? 'PERFECT' : 'INCOMPLETE'}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] border-t border-current pt-1">
          {isComplete ? '完美闭环' : '未达成'}
        </div>
        {isComplete && (
          <div className="absolute -top-2 -right-2 bg-[#b58362] text-white p-1 rounded-full">
            <Check size={12} strokeWidth={4} />
          </div>
        )}
      </motion.div>

      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.12)_1px,transparent_0)] [background-size:10px_10px]"
        aria-hidden
      />
    </div>
  );
};


export const WordQuenchingFunnel = ({
  stats,
  totalWords,
  hasStuckWarning = false,
  stuckCount = 0,
  selectedDay = 'All',
  onDayChange,
  onCategoryClick,
}: {
  stats: any;
  totalWords: number;
  hasStuckWarning?: boolean;
  stuckCount?: number;
  selectedDay?: string;
  onDayChange?: (day: string) => void;
  onCategoryClick?: (category: WordStatus) => void;
}) => {
  const cohortDays = ['All', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];

  return (
    <div className="relative py-12">
      <div className="absolute top-0 left-0 text-[10px] text-[#8c8881] font-serif italic opacity-40">词汇淬炼流转图 / Vocabulary Tempering Funnel</div>

      <div className="flex items-center gap-2 mb-8 mt-4 overflow-x-auto pb-2 scrollbar-hide">
        {cohortDays.map((day) => (
          <button
            key={day}
            onClick={() => onDayChange?.(day)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[10px] font-serif font-bold tracking-widest transition-all whitespace-nowrap',
              selectedDay === day
                ? 'bg-[#2D3436] text-white shadow-lg'
                : 'bg-black/5 text-[#8c8881] hover:bg-black/10'
            )}
          >
            {day === 'All' ? '全部批次' : `循环第 ${day} 天`}
          </button>
        ))}
      </div>
      <p className="text-[8px] text-[#a8a29a] mb-2 -mt-2 max-w-lg leading-relaxed">
        上表「Day 1～5」为「5 日艾宾浩斯大循环」中的批次标签（非一日内五步）；生词→七分熟→全熟依累计遍数；跨日仅影响「当日计划」记账，不清空词与遍数。
      </p>
      <p className="text-[9px] text-[#8c8881] mb-6 font-medium">
        {selectedDay === 'All' ? (
          <>
            本书已入库（主攻书词表）共 <span className="text-[#1f1e1d] font-bold">{totalWords}</span> 词，三档数字之和应等于此数
          </>
        ) : (
          <>
            当前视图：<span className="text-[#1f1e1d] font-bold">{selectedDay}</span> 批次内共{' '}
            <span className="text-[#1f1e1d] font-bold">{totalWords}</span> 词（三档合计）
          </>
        )}
      </p>

      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div
          className="flex-1 space-y-3 md:space-y-4 cursor-pointer group"
          onClick={() => onCategoryClick?.('new')}
        >
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
              <Zap size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-center">
              <div className="text-[8px] md:text-[10px] font-serif font-bold text-[#1f1e1d] tracking-widest uppercase">生肉 (Raw)</div>
              <div className="hidden md:block text-[9px] text-[#8c8881] italic">待烹饪的生词</div>
            </div>
          </div>
          <div className="h-20 md:h-24 bg-gray-50 rounded-xl md:rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-2 md:p-4 group-hover:bg-gray-100 transition-colors">
            <div className="text-xl md:text-2xl font-display font-bold text-gray-400">{stats.new}</div>
          </div>
        </div>

        <div className="pt-8 md:pt-12 text-[#fae5d3] shrink-0">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronRight size={16} className="md:w-6 md:h-6" />
          </motion.div>
        </div>

        <div
          className="flex-1 space-y-3 md:space-y-4 relative cursor-pointer group"
          onClick={() => onCategoryClick?.('familiar_70')}
        >
          {hasStuckWarning && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-[#C85A5A] text-white text-[7px] md:text-[8px] font-bold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1"
              >
                <Zap size={6} className="md:w-2 md:h-2" fill="white" /> {stuckCount} 词滞留超 5 轮
              </motion.div>
            </div>
          )}
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#fae5d3] flex items-center justify-center text-[#b58362] group-hover:scale-110 transition-transform">
              <Flame size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-center">
              <div className="text-[8px] md:text-[10px] font-serif font-bold text-[#1f1e1d] tracking-widest uppercase">七分熟 (Medium)</div>
              <div className="hidden md:block text-[9px] text-[#8c8881] italic">外焦里嫩</div>
            </div>
          </div>
          <div className="h-20 md:h-24 bg-[#FDF6F0] rounded-xl md:rounded-2xl border border-[#fae5d3] flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden group-hover:bg-[#fae5d3]/30 transition-colors">
            <div className="text-xl md:text-2xl font-display font-bold text-[#b58362] z-10">{stats.familiar_70}</div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#fae5d3]/30 blur-xl"
            />
          </div>
        </div>

        <div className="pt-8 md:pt-12 text-[#fae5d3] shrink-0">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
            <ChevronRight size={16} className="md:w-6 md:h-6" />
          </motion.div>
        </div>

        <div
          className="flex-1 space-y-3 md:space-y-4 cursor-pointer group"
          onClick={() => onCategoryClick?.('familiar_100')}
        >
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#2D3436] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Trophy size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-center">
              <div className="text-[8px] md:text-[10px] font-serif font-bold text-[#1f1e1d] tracking-widest uppercase">全熟 (Done)</div>
              <div className="hidden md:block text-[9px] text-[#8c8881] italic">彻底掌握</div>
            </div>
          </div>
          <div className="h-20 md:h-24 bg-[#2D3436] rounded-xl md:rounded-2xl flex flex-col items-center justify-center p-2 md:p-4 shadow-xl group-hover:bg-black transition-colors">
            <div className="text-xl md:text-2xl font-display font-bold text-white">{stats.familiar_100}</div>
            <div className="text-[7px] md:text-[8px] text-white/40 uppercase tracking-tighter mt-0.5 md:mt-1">Mastered</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-[9px] text-[#b58362] font-bold">昨日淬炼转化率 18%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

type DayHistoryRow = {
  new?: number;
  familiar_70?: number;
  familiar_100?: number;
  /** 循环复习：倒计时过完一词计 1（与扫词手势记词并列计入热力图） */
  reviewed?: number;
  studyTime?: number;
};

/** 当日学习量：扫词记词 + 循环复习过完的词（各计一次） */
export function dailyMarkedWordCount(h: unknown): number {
  if (!h || typeof h !== 'object') return 0;
  const e = h as DayHistoryRow;
  return (
    (e.new ?? 0) +
    (e.familiar_70 ?? 0) +
    (e.familiar_100 ?? 0) +
    (e.reviewed ?? 0)
  );
}

function dayHasActivity(h: unknown): boolean {
  if (!h || typeof h !== 'object') return false;
  const e = h as DayHistoryRow;
  const g = dailyMarkedWordCount(h);
  const t = typeof e.studyTime === 'number' && Number.isFinite(e.studyTime) ? e.studyTime : 0;
  return g > 0 || t > 0;
}

/** 从今天起往回数连续「有记词或有过专注计时」的北京日；当日尚未学习时允许顺延一天不断档 */
function computeLearningStreak(todayKey: string, history: Record<string, unknown>): number {
  let streak = 0;
  let i = 0;
  let skippedTodayGrace = false;
  while (i < 800) {
    const key = addBeijingCalendarDays(todayKey, -i);
    const active = dayHasActivity(history[key]);
    if (active) {
      streak++;
      i++;
      continue;
    }
    if (!skippedTodayGrace && i === 0) {
      skippedTodayGrace = true;
      i++;
      continue;
    }
    break;
  }
  return streak;
}

function countActiveDaysInWindow(todayKey: string, history: Record<string, unknown>, windowDays: number): number {
  let n = 0;
  for (let d = 0; d < windowDays; d++) {
    const key = addBeijingCalendarDays(todayKey, -d);
    if (dayHasActivity(history[key])) n++;
  }
  return n;
}

function sumStudySeconds(history: Record<string, unknown>): number {
  let s = 0;
  for (const k of Object.keys(history)) {
    const e = history[k];
    if (e && typeof e === 'object' && typeof (e as DayHistoryRow).studyTime === 'number') {
      const t = (e as DayHistoryRow).studyTime!;
      if (Number.isFinite(t) && t > 0) s += t;
    }
  }
  return Math.floor(s);
}

function formatStudyDuration(totalSec: number): string {
  if (totalSec <= 0) return '—';
  if (totalSec < 60) return `${totalSec} 秒`;
  const m = Math.floor(totalSec / 60);
  if (m < 60) return `${m} 分钟`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h} 小时 ${rm} 分` : `${h} 小时`;
}

/** 顶部统计四宫格单卡 */
function StatMiniCard({
  title,
  children,
  foot,
}: {
  title: string;
  children: ReactNode;
  foot: string;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col min-h-[128px] rounded-[1.35rem] md:rounded-[1.6rem]',
        'border border-[#e3ddd4] bg-gradient-to-b from-white to-[#faf8f4]',
        'p-4 md:p-5 pt-5',
        'shadow-[0_2px_14px_-3px_rgba(44,36,23,0.07)]',
        'transition-all duration-300 hover:border-[#d4cbc0] hover:shadow-[0_10px_32px_-10px_rgba(44,36,23,0.14)]'
      )}
    >
      <div
        className="absolute top-0 left-5 right-5 h-[3px] rounded-b-full bg-gradient-to-r from-[#c9a87c]/0 via-[#b58362]/35 to-[#c9a87c]/0 opacity-90"
        aria-hidden
      />
      <span className="text-[11px] font-medium text-[#6f6a63] tracking-wide">{title}</span>
      <div className="mt-2 flex-1 flex items-center min-h-[2.75rem]">{children}</div>
      <p className="text-[10px] text-[#9c9690] leading-relaxed mt-3 pt-3 border-t border-dashed border-[#e5e0d8]/90">{foot}</p>
    </div>
  );
}

export type LearningStatsOverviewProps = {
  stats: { new?: number; familiar_70?: number; familiar_100?: number };
  history: Record<string, unknown>;
};

/** 与热力图同风格的摘要区：连续打卡、活跃日、专注时长、熟度条等 */
export function LearningStatsOverview({ stats, history }: LearningStatsOverviewProps) {
  const todayKey = getBeijingDateKey();
  const streak = useMemo(() => computeLearningStreak(todayKey, history), [todayKey, history]);
  const active182 = useMemo(() => countActiveDaysInWindow(todayKey, history, 182), [todayKey, history]);
  const studySec = useMemo(() => sumStudySeconds(history), [history]);
  const todayWordsMarked = useMemo(() => dailyMarkedWordCount(history[todayKey]), [todayKey, history]);

  const n = Math.max(0, stats.new ?? 0);
  const f70 = Math.max(0, stats.familiar_70 ?? 0);
  const f100 = Math.max(0, stats.familiar_100 ?? 0);
  const totalLive = Math.max(1, n + f70 + f100);

  return (
    <div className="space-y-5 md:space-y-6 w-full">
      <header className="text-center md:text-left space-y-2">
        <h2 className="text-[1.65rem] md:text-[1.85rem] font-serif font-bold text-[#1f1c18] tracking-wide">学习统计</h2>
        <p className="text-[10px] md:text-[11px] text-[#8c8881] font-sans font-semibold tracking-[0.2em] uppercase">
          Learning insights
        </p>
        <p className="text-[11px] md:text-xs text-[#6b645c] leading-relaxed max-w-xl mx-auto md:mx-0">
          摘要与热力图均按北京时间自然日统计；格子颜色按当日学习量加深（扫词 + 循环复习）。
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatMiniCard title="连续打卡" foot="自然日 · 有记词或专注计时">
          <div className="text-[1.85rem] md:text-[2.15rem] font-serif font-bold text-[#1f1c18] tabular-nums leading-none tracking-tight">
            {streak}
          </div>
        </StatMiniCard>
        <StatMiniCard title="今日学习量" foot="扫词记一词或复习过完一词各计一次">
          <div className="text-[1.85rem] md:text-[2.15rem] font-serif font-bold text-[#1f1c18] tabular-nums leading-none tracking-tight">
            {todayWordsMarked}
          </div>
        </StatMiniCard>
        <StatMiniCard title="半年活跃" foot="近 6 个月内有学习记录的天数">
          <div className="flex items-baseline gap-1 text-[#1f1c18]">
            <span className="text-[1.85rem] md:text-[2.15rem] font-serif font-bold tabular-nums leading-none tracking-tight">
              {active182}
            </span>
            <span className="text-sm font-sans font-medium text-[#a39e96]">/ 182</span>
          </div>
        </StatMiniCard>
        <StatMiniCard title="累计专注" foot="扫词界面停留计时，按日写入历史">
          <div className="text-[1.35rem] md:text-[1.55rem] font-serif font-bold text-[#1f1c18] leading-snug tracking-tight">
            {formatStudyDuration(studySec)}
          </div>
        </StatMiniCard>
      </div>

      <div
        className={cn(
          'rounded-[1.5rem] md:rounded-[2rem] border border-[#e0d9cf]',
          'bg-gradient-to-b from-[#fdfcfa] via-[#faf7f1] to-[#f3efe8]',
          'p-5 md:p-8 shadow-[0_4px_24px_-8px_rgba(44,36,23,0.1)]',
          'ring-1 ring-white/60'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 md:gap-6 mb-6 md:mb-7">
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.28em] text-[#b58362]/85">Mastery mix</p>
            <h3 className="text-lg md:text-xl font-serif font-bold text-[#1f1c18]">全库熟度概览</h3>
            <p className="text-[11px] text-[#8c8881] max-w-md">累计标记次数（与词表去重无关）</p>
          </div>
          <div className="flex items-end gap-2 sm:flex-col sm:items-end sm:gap-0.5 sm:text-right shrink-0">
            <span className="text-[10px] font-medium text-[#8c8881]">全熟累计</span>
            <span className="text-3xl md:text-4xl font-serif font-bold text-[#b58362] tabular-nums leading-none">{f100}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
          {[
            { label: '生词', value: n, dot: 'bg-[#d8d6d0]', text: 'text-[#3d3833]' },
            { label: '七分熟', value: f70, dot: 'bg-[#e8c4a8]', text: 'text-[#9a6b4a]' },
            { label: '全熟', value: f100, dot: 'bg-[#b58362]', text: 'text-[#8f6848]' },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-xl md:rounded-2xl bg-white/70 border border-[#ebe6df] px-3 py-3 md:px-4 md:py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className={cn('h-2 w-2 rounded-full shrink-0', row.dot)} aria-hidden />
                <span className="text-[10px] md:text-[11px] font-medium text-[#7a736c]">{row.label}</span>
              </div>
              <div className={cn('text-xl md:text-2xl font-serif font-bold tabular-nums', row.text)}>{row.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#e8e3dc]/90 p-1.5 md:p-2 flex gap-1 md:gap-1.5 shadow-inner">
          <div
            style={{ width: `${(n / totalLive) * 100}%` }}
            className="min-h-[10px] md:min-h-[12px] min-w-[2px] rounded-lg bg-gradient-to-b from-[#efeee9] to-[#dcdad4] ring-1 ring-black/[0.04] transition-all"
            title={`生词 ${n}`}
          />
          <div
            style={{ width: `${(f70 / totalLive) * 100}%` }}
            className="min-h-[10px] md:min-h-[12px] min-w-[2px] rounded-lg bg-gradient-to-b from-[#fce8d8] to-[#e8c4a8] ring-1 ring-[#c49a7a]/25 transition-all"
            title={`七分熟 ${f70}`}
          />
          <div
            style={{ width: `${(f100 / totalLive) * 100}%` }}
            className="min-h-[10px] md:min-h-[12px] min-w-[2px] rounded-lg bg-gradient-to-b from-[#e8c9a8] to-[#b58362] ring-1 ring-[#b58362]/25 transition-all"
            title={`全熟 ${f100}`}
          />
        </div>
      </div>
    </div>
  );
}

export const LearningHeatmap = ({ history }: { history: Record<string, any> }) => {
  const todayKey = getBeijingDateKey();

  // 为了让矩阵左侧对齐周日，我们需要找出起始偏移量
  // 按照 anchor 逻辑计算
  const todayObj = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const todayDayOfWeek = todayObj.getDay(); // 0 (Sun) - 6 (Sat)
  
  // 我们总共展示 TOTAL_CELLS 个格子，确保最左边是周日
  // GitHub 通常是 52 周，我们这里做 26 周（半年）
  const totalWeeks = 26;
  // 计算基础偏移：我们要让矩阵的最右侧那周包含今天，且格子的 index % 7 对应 Sunday..Saturday
  const days = Array.from({ length: totalWeeks * 7 }, (_, i) => {
    // 算法：第 25 周（最后一周）的对应星期应该是 Today
    // dayDelta = 0 表示今天；负数表示过去
    // 我们让最后一周的起始 index 是 (totalWeeks - 1) * 7
    const lastWeekStartIdx = (totalWeeks - 1) * 7;
    const dayDelta = i - (lastWeekStartIdx + todayDayOfWeek);
    const dateStr = addBeijingCalendarDays(todayKey, dayDelta);
    
    const dayData = history[dateStr];
    const total = dailyMarkedWordCount(dayData);

    let intensity = 0;
    if (total > 0) intensity = 1;
    if (total > 30) intensity = 2;
    if (total > 80) intensity = 3;
    if (total > 150) intensity = 4;

    // 解析日期以显示月份标签
    const [y, m, d] = dateStr.split('-').map(Number);
    const isFirstDayOfMonth = d === 1;

    return {
      intensity,
      date: dateStr,
      count: total,
      m,
      d,
      isFirstDayOfMonth,
    };
  });

  // 提取月份标签：如果这一周的第一天（i%7===0）包含了月初，则在该周上方标记月份
  const monthLabels: { weekIndex: number; label: string }[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const firstDayOfWeek = days[w * 7];
    if (firstDayOfWeek && (w === 0 || firstDayOfWeek.d <= 7)) {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthLabels.push({ weekIndex: w, label: monthNames[firstDayOfWeek.m].toUpperCase() });
    }
  }

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-black/[0.06] shadow-[0_8px_40px_-12px_rgba(44,36,23,0.12)] space-y-6 md:space-y-8 w-full overflow-hidden flex flex-col justify-center">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1.5">
          <h4 className="text-base md:text-lg font-serif font-bold text-[#2c2417] tracking-wide">
            学习轨迹 / <span className="text-[11px] md:text-xs font-sans font-bold tracking-[0.2em] text-[#5c5346]">LEARNING HEATMAP</span>
          </h4>
          <p className="text-[11px] md:text-xs text-[#8c8881] font-sans leading-relaxed">
            过去 6 个月每日学习量（扫词 + 复习）· 共 182 天
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-[#8c8881] font-sans font-semibold shrink-0">
          <span>Less</span>
          <div className="flex gap-1.5 items-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-2.5 h-2.5 rounded-full shrink-0',
                  i === 0
                    ? 'bg-[#EDE9E2]'
                    : i === 1
                      ? 'bg-[#e8d5c4]'
                      : i === 2
                        ? 'bg-[#d4a88a]'
                        : i === 3
                          ? 'bg-[#b58362]'
                          : 'bg-[#8B5E3C]'
                )}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Week Labels */}
        <div className="flex flex-col justify-between pt-6 pb-2 text-[8px] md:text-[9px] font-sans font-bold text-[#b58362]/45 uppercase tracking-tight select-none min-w-[2rem]">
          <span>SUN</span>
          <span className="opacity-0" aria-hidden>
            MON
          </span>
          <span>TUE</span>
          <span className="opacity-0" aria-hidden>
            WED
          </span>
          <span>THU</span>
          <span className="opacity-0" aria-hidden>
            FRI
          </span>
          <span className="opacity-0" aria-hidden>
            SAT
          </span>
        </div>

        <div className="flex-1 relative pt-6 overflow-x-auto hide-scrollbar">
          {/* Month Labels Layer */}
          <div className="absolute top-0 left-0 right-0 flex text-[7px] md:text-[9px] font-bold text-[#b58362]/60 uppercase tracking-tighter">
            {monthLabels.map((ml, idx) => (
              <div 
                key={idx} 
                className="absolute whitespace-nowrap"
                style={{ left: `${(ml.weekIndex / totalWeeks) * 100}%` }}
              >
                {ml.label}
              </div>
            ))}
          </div>

          {/* Grid Matrix */}
          <div 
            className="grid gap-1 md:gap-1.5"
            style={{ 
              gridTemplateRows: 'repeat(7, 1fr)',
              gridAutoFlow: 'column',
              gridAutoColumns: 'minmax(0, 1fr)'
            }}
          >
            {days.map((d, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.0005 }}
                className={cn(
                  'aspect-square rounded-[2px] md:rounded-[3px] transition-all hover:ring-2 hover:ring-[#b58362] ring-offset-1 ring-offset-white cursor-help border border-black/[0.02]',
                  d.intensity === 0
                    ? 'bg-black/5'
                    : d.intensity === 1
                      ? 'bg-[#b58362]/20'
                      : d.intensity === 2
                        ? 'bg-[#b58362]/40'
                        : d.intensity === 3
                          ? 'bg-[#b58362]/70'
                          : 'bg-[#b58362]',
                  new Date(d.date) > new Date() && 'opacity-20 pointer-events-none'
                )}
                title={`${d.date} · 学习量 ${d.count}（词次）`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-black/[0.06] pt-4">
        <p className="text-[10px] md:text-[11px] text-[#a8a29a] leading-relaxed italic font-serif text-center sm:text-left">
          格子按当日学习量着色：扫词每记一词、循环复习每过完一词各计一次；断学将按「严规」重置此区域记录。
        </p>
        {Object.keys(history).length === 0 && (
          <p className="text-[10px] text-[#b58362] font-sans font-medium text-center sm:text-right mt-2 animate-pulse">
            记忆种子已埋下，等待破土时刻…
          </p>
        )}
      </div>
    </div>
  );
};

interface StatsDashboardProps {
  stats: any;
  history?: any;
  onRecovery?: () => void;
}

export const StatsDashboard = ({ stats, history, onRecovery }: StatsDashboardProps) => {
  const data = [
    { name: '生词', value: stats.new ?? 0, color: '#f3f4f6' },
    { name: '七分熟', value: stats.familiar_70 ?? 0, color: '#fae5d3' },
    { name: '全熟', value: stats.familiar_100 ?? 0, color: '#b58362' },
  ];

  const total = stats.new + stats.familiar_70 + stats.familiar_100 || 1;

  return (
    <div className="bg-white/40 p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-black/5 backdrop-blur-sm space-y-6 h-full">
      <div className="space-y-1">
        <h4 className="text-xs font-serif font-bold text-[#1f1e1d] tracking-widest uppercase">记忆强度分布 / Strength Distribution</h4>
        <p className="text-[9px] text-[#8c8881] italic">全库单词掌握深度分析</p>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between items-end text-[10px] font-bold">
              <span className="text-[#8c8881]">{item.name}</span>
              <span className="text-[#1f1e1d]">{item.value} 词</span>
            </div>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.value / total) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EbbinghausChart = ({
  yesterdayGrowth = 0,
  actualSeries,
  stats,
  targetTotal,
  onRecovery,
}: {
  yesterdayGrowth?: number;
  actualSeries?: number[];
  stats?: any;
  targetTotal?: number;
  onRecovery?: () => void;
}) => {
  const natural = [26, 24, 23, 22, 21];
  const actual = (actualSeries && actualSeries.length === 5 ? actualSeries : [95, 92, 90, 94, 98]).map((v) =>
    Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0))
  );

  const todayKey = getBeijingDateKey();
  const keys = Array.from({ length: 5 }, (_, i) => addBeijingCalendarDays(todayKey, -(4 - i))); // Day1..Day5
  const shortDate = (k: string) => (k && k.length >= 10 ? k.slice(5) : k);

  const chartData = actual.map((v, i) => {
    const dateKey = keys[i];
    const dateLabel = shortDate(dateKey);
    return {
      day: `Day ${i + 1}`,
      dateKey,
      dateLabel,
      xLabel: `Day ${i + 1} (${dateLabel})`,
      natural: natural[i],
      actual: v,
      gap: [Math.min(natural[i], v), Math.max(natural[i], v)],
      label: i === 0 ? '近5日轨迹（真实）' : '',
    };
  });
  const peak = Math.max(...chartData.map((d) => Math.max(d.actual, d.natural)));
  const yMax = Math.max(35, peak + 8);
  return (
    <div className="relative w-full h-full flex flex-col">
      <GlobalStatsSummary stats={stats} targetTotal={targetTotal} />
      
      {/* Legend refined and moved down slightly to avoid stats overlap */}
      <div className="flex justify-end pr-4 gap-4 text-[8px] md:text-[9px] tracking-widest uppercase font-bold text-[#8c8881]/60 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-[2px] bg-[#b58362]" />
          实际留存 (Actual)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-[2px] border-t-2 border-dashed border-[#8c8881]" />
          自然遗忘 (Natural)
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 26, left: 26, bottom: 14 }}>
          <defs>
            <linearGradient id="actualGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b58362" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#b58362" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000006" />
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            interval={0}
            minTickGap={0}
            padding={{ left: 12, right: 12 }}
            tick={{ fontSize: 10, fill: '#8c8881', fontWeight: 500 }}
            dy={6}
          />
          <YAxis hide domain={[0, yMax]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#b58362', strokeWidth: 1, strokeDasharray: '4 4' }} />

          <Area type="monotone" dataKey="actual" stroke="none" fill="url(#actualGlow)" animationDuration={1400} />

          <Line
            type="monotone"
            dataKey="natural"
            stroke="#8c8881"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            animationDuration={2000}
          />

          <Line
            type="monotone"
            dataKey="actual"
            stroke="#b58362"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#b58362', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#b58362', strokeWidth: 4, stroke: 'white' }}
            animationDuration={1500}
          />
          <ReferenceDot
            x={chartData[0]?.dateLabel}
            y={chartData[0]?.natural ?? 26}
            r={0}
            label={{ position: 'left', value: `${chartData[0]?.natural ?? 26}%`, fill: '#8c8881', fontSize: 9 }}
          />
          <ReferenceDot
            x={chartData[4]?.dateLabel}
            y={chartData[4]?.natural ?? 21}
            r={0}
            label={{ position: 'right', value: `${chartData[4]?.natural ?? 21}%`, fill: '#8c8881', fontSize: 9 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};

const GlobalStatsSummary = ({ 
  stats, 
  targetTotal: targetFromProps,
}: { 
  stats: any; 
  targetTotal?: number;
}) => {
  const targetTotal = Math.max(targetFromProps || 1, 1);
  const currentTotal = stats?.familiar_100 ?? 0;
  const remaining = Math.max(0, targetTotal - currentTotal);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between mb-8 px-2">
      {/* Only Left Column: Semantic Branding */}
      <div className="flex flex-col space-y-2 text-center lg:text-left">
        <h4 className="text-[10px] md:text-xs font-serif font-black text-[#b58362] uppercase tracking-[0.4em] whitespace-nowrap">
          全库通关阵列 / GLOBAL MASTERY ARRAY
        </h4>
        <p className="text-[9px] text-[#8c8881] italic opacity-40 uppercase tracking-widest whitespace-nowrap">
          The trajectory of memory growth synchronization
        </p>
      </div>
    </div>
  );
};

export const StrengthDistribution = ({ stats }: { stats: any }) => {
  const data = [
    { name: '生词', value: stats.new ?? 0, color: '#f3f4f6' },
    { name: '七分熟', value: stats.familiar_70 ?? 0, color: '#fae5d3' },
    { name: '全熟', value: stats.familiar_100 ?? 0, color: '#b58362' },
  ];
  const total = (stats.new ?? 0) + (stats.familiar_70 ?? 0) + (stats.familiar_100 ?? 0) || 1;
  return (
    <div className="bg-white/40 p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-black/5 backdrop-blur-sm space-y-6 h-full">
      <div className="space-y-1">
        <h4 className="text-xs font-serif font-bold text-[#1f1e1d] tracking-widest uppercase">记忆强度分布 / STRENGTH DISTRIBUTION</h4>
        <p className="text-[9px] text-[#8c8881] italic">全库单词掌握深度分析</p>
      </div>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between items-end text-[10px] font-bold">
              <span className="text-[#8c8881]">{item.name}</span>
              <span className="text-[#1f1e1d]">{item.value} 词</span>
            </div>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.value / total) * 100}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
