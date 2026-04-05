/** 词书单词：导入词书用完整 words；内置词书从 /vocab/{id}.json 加载 */

export type BookWordPreview = {
  id: string;
  word: string;
  meaning: string;
  phonetic: string;
};

/** 内置词书对应静态词表（由 scripts/build-vocab.mjs 生成） */
export const BUILT_IN_VOCAB_URL: Record<string, string> = {
  'focus-2': '/vocab/focus-2.json',
  'coll-1': '/vocab/coll-1.json',
  'coll-2': '/vocab/coll-2.json',
  'coll-3': '/vocab/coll-3.json',
  'coll-4': '/vocab/coll-4.json',
  'coll-5': '/vocab/coll-5.json',
  'coll-6': '/vocab/coll-6.json',
  'coll-7': '/vocab/coll-7.json',
  'coll-8': '/vocab/coll-8.json',
  'coll-9': '/vocab/coll-9.json',
  'coll-10': '/vocab/coll-10.json',
  'coll-11': '/vocab/coll-11.json',
  'coll-13': '/vocab/coll-13.json',
};

export function hasBuiltInVocabFile(bookId: string): boolean {
  return bookId in BUILT_IN_VOCAB_URL;
}

const IELTS_SAMPLE: BookWordPreview[] = [
  { id: 'ielts-1', word: 'Minimalism', meaning: '极简主义', phonetic: '/ˈmɪnɪməlɪzəm/' },
  { id: 'ielts-2', word: 'Traction', meaning: '牵引力；（观点）受重视', phonetic: '/ˈtrækʃn/' },
  { id: 'ielts-3', word: 'Resilience', meaning: '恢复力；韧性', phonetic: '/rɪˈzɪliəns/' },
  { id: 'ielts-4', word: 'Paradigm', meaning: '范例；典范', phonetic: '/ˈpærədaɪm/' },
  { id: 'ielts-5', word: 'Coherent', meaning: '连贯的；一致的', phonetic: '/kəʊˈhɪərənt/' },
  { id: 'ielts-6', word: 'Plausible', meaning: '貌似合理的', phonetic: '/ˈplɔːzəbl/' },
  { id: 'ielts-7', word: 'Mitigate', meaning: '减轻；缓和', phonetic: '/ˈmɪtɪɡeɪt/' },
  { id: 'ielts-8', word: 'Ubiquitous', meaning: '无处不在的', phonetic: '/juːˈbɪkwɪtəs/' },
  { id: 'ielts-9', word: 'Pragmatic', meaning: '务实的；实用主义的', phonetic: '/præɡˈmætɪk/' },
  { id: 'ielts-10', word: 'Deteriorate', meaning: '恶化；退化', phonetic: '/dɪˈtɪəriəreɪt/' },
];

const IELTS_538_SAMPLE: BookWordPreview[] = [
  { id: 'i538-1', word: 'Envisage', meaning: '展望；构想', phonetic: '/ɪnˈvɪzɪdʒ/' },
  { id: 'i538-2', word: 'Surveillance', meaning: '监视；监督', phonetic: '/sɜːˈveɪləns/' },
  { id: 'i538-3', word: 'Unprecedented', meaning: '史无前例的', phonetic: '/ʌnˈpresɪdentɪd/' },
  { id: 'i538-4', word: 'Acknowledge', meaning: '承认；致谢', phonetic: '/əkˈnɒlɪdʒ/' },
  { id: 'i538-5', word: 'Sustainable', meaning: '可持续的', phonetic: '/səˈsteɪnəbl/' },
];

const ZSB_SAMPLE: BookWordPreview[] = [
  { id: 'zsb-1', word: 'Occur', meaning: '发生；出现', phonetic: '/əˈkɜː(r)/' },
  { id: 'zsb-2', word: 'Inhabit', meaning: '居住于；栖息', phonetic: '/ɪnˈhæbɪt/' },
  { id: 'zsb-3', word: 'Fundamental', meaning: '基本的；根本的', phonetic: '/ˌfʌndəˈmentl/' },
  { id: 'zsb-4', word: 'Obvious', meaning: '明显的', phonetic: '/ˈɒbviəs/' },
  { id: 'zsb-5', word: 'Appreciate', meaning: '欣赏；感激', phonetic: '/əˈpriːʃieɪt/' },
];

const CET6_SAMPLE: BookWordPreview[] = [
  { id: 'cet6-1', word: 'Ambiguous', meaning: '模棱两可的', phonetic: '/æmˈbɪɡjuəs/' },
  { id: 'cet6-2', word: 'Elaborate', meaning: '精心制作；详细阐述', phonetic: '/ɪˈlæbərət/' },
  { id: 'cet6-3', word: 'Hierarchy', meaning: '等级制度', phonetic: '/ˈhaɪərɑːki/' },
  { id: 'cet6-4', word: 'Incentive', meaning: '激励；动机', phonetic: '/ɪnˈsentɪv/' },
  { id: 'cet6-5', word: 'Preliminary', meaning: '初步的；预备的', phonetic: '/prɪˈlɪmɪnəri/' },
  { id: 'cet6-6', word: 'Scrutiny', meaning: '仔细检查', phonetic: '/ˈskruːtəni/' },
  { id: 'cet6-7', word: 'Vulnerable', meaning: '易受伤害的', phonetic: '/ˈvʌlnərəbl/' },
  { id: 'cet6-8', word: 'Warrant', meaning: '保证；授权', phonetic: '/ˈwɒrənt/' },
  { id: 'cet6-9', word: 'Alleviate', meaning: '减轻；缓和', phonetic: '/əˈliːvieɪt/' },
  { id: 'cet6-10', word: 'Consensus', meaning: '共识', phonetic: '/kənˈsensəs/' },
];

const KY_SAMPLE: BookWordPreview[] = [
  { id: 'ky-1', word: 'Substantial', meaning: '大量的；实质的', phonetic: '/səbˈstænʃl/' },
  { id: 'ky-2', word: 'Underlying', meaning: '潜在的；根本的', phonetic: '/ˌʌndəˈlaɪɪŋ/' },
  { id: 'ky-3', word: 'Comprehensive', meaning: '全面的', phonetic: '/ˌkɒmprɪˈhensɪv/' },
  { id: 'ky-4', word: 'Intrinsic', meaning: '内在的；固有的', phonetic: '/ɪnˈtrɪnsɪk/' },
  { id: 'ky-5', word: 'Paradox', meaning: '悖论；矛盾的人或事', phonetic: '/ˈpærədaɪm/' },
  { id: 'ky-6', word: 'Rigorous', meaning: '严格的；缜密的', phonetic: '/ˈrɪɡərəs/' },
  { id: 'ky-7', word: 'Scrutinize', meaning: '详细检查', phonetic: '/ˈskruːtənaɪz/' },
  { id: 'ky-8', word: 'Unprecedented', meaning: '史无前例的', phonetic: '/ʌnˈpresɪdentɪd/' },
  { id: 'ky-9', word: 'Viable', meaning: '可行的', phonetic: '/ˈvaɪəbl/' },
  { id: 'ky-10', word: 'Zealous', meaning: '热情的；狂热的', phonetic: '/ˈzeləs/' },
];

const SAMPLE_BY_ID: Record<string, BookWordPreview[]> = {
  'focus-2': IELTS_538_SAMPLE,
  'coll-1': CET6_SAMPLE,
  'coll-3': KY_SAMPLE,
  'coll-8': ZSB_SAMPLE,
};

export type ResolvedBookWords = {
  list: BookWordPreview[];
  totalInBook: number;
  isFullCorpus: boolean;
};

export function resolveBookWordList(book: {
  id: string;
  count?: number;
  words?: BookWordPreview[];
}): ResolvedBookWords {
  if (book.words && book.words.length > 0) {
    return {
      list: book.words.map((w, i) => ({
        id: w.id ?? `${book.id}-w-${i}`,
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic ?? '',
      })),
      totalInBook: book.count ?? book.words.length,
      isFullCorpus: true,
    };
  }
  // 如果是内置词书且已知有对应的 JSON
  if (hasBuiltInVocabFile(book.id)) {
    const total = book.count && book.count > 0 ? book.count : 0;
    // 强制先返回一个 Sample 的前几项以避免 UI 直接报错，实际内容由外部 fetch 覆盖
    const sample = SAMPLE_BY_ID[book.id] ?? IELTS_SAMPLE;
    return { list: sample.slice(0, 5), totalInBook: total, isFullCorpus: true };
  }
  const sample = SAMPLE_BY_ID[book.id] ?? IELTS_SAMPLE;
  const total = book.count && book.count > 0 ? book.count : sample.length;
  return { list: sample, totalInBook: total, isFullCorpus: false };
}

export function getFallbackSampleList(bookId: string): BookWordPreview[] {
  return SAMPLE_BY_ID[bookId] ?? IELTS_SAMPLE;
}
