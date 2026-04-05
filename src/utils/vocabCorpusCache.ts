import {
  BUILT_IN_VOCAB_URL,
  hasBuiltInVocabFile,
  type BookWordPreview,
  getFallbackSampleList,
} from '../data/vocabBookWords';

const resolved = new Map<string, BookWordPreview[]>();
const inflight = new Map<string, Promise<BookWordPreview[]>>();

/**
 * 内置词书整包只拉取、解析一次并缓存；避免每次进「今日扫词」都重新下载大 JSON。
 */
export function fetchBuiltInCorpusCached(bookId: string): Promise<BookWordPreview[]> {
  if (!hasBuiltInVocabFile(bookId)) {
    return Promise.reject(new Error('no built-in vocab for id'));
  }
  const hit = resolved.get(bookId);
  if (hit) return Promise.resolve(hit);

  const existing = inflight.get(bookId);
  if (existing) return existing;

  const url = BUILT_IN_VOCAB_URL[bookId];
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('load');
      return r.json() as Promise<BookWordPreview[]>;
    })
    
    .then((data) => {
      resolved.set(bookId, data);
      inflight.delete(bookId);
      return data;
    })
    .catch(() => {
      // 静态 JSON 加载失败时，为了不让前端整页报错，退回到内置 sample 列表。
      const fallback = getFallbackSampleList(bookId);
      resolved.set(bookId, fallback);
      inflight.delete(bookId);
      return fallback;
    });
  inflight.set(bookId, p);
  return p;
}

type PrefetchOpts = { eager?: boolean };

/**
 * 预拉取主攻书词表。eager：尽快发起请求（首页 / 换书后立即预载）；
 * 默认用 requestIdleCallback，避免与其它首屏任务抢主线程。
 */
export function prefetchBuiltInCorpus(
  bookId: string | null | undefined,
  opts?: PrefetchOpts
): void {
  if (!bookId || !hasBuiltInVocabFile(bookId)) return;
  if (resolved.has(bookId)) return;
  const run = () => void fetchBuiltInCorpusCached(bookId).catch(() => {});
  if (opts?.eager) {
    run();
    return;
  }
  const schedule =
    typeof requestIdleCallback === 'function'
      ? (cb: () => void) => requestIdleCallback(cb, { timeout: 2500 })
      : (cb: () => void) => window.setTimeout(cb, 300);
  schedule(run);
}
