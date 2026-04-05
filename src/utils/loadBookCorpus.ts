import { hasBuiltInVocabFile } from '../data/vocabBookWords';
import { fetchBuiltInCorpusCached } from './vocabCorpusCache';
import type { Word } from '../types/vocabularyWord';

/** 拉取本书完整词表（内置走缓存，自建用内存 words） */
export async function loadRawCorpusForBook(fb: { id: string; words?: Word[] }) {
  if (hasBuiltInVocabFile(fb.id)) return fetchBuiltInCorpusCached(fb.id);
  if (fb.words?.length) {
    return fb.words.map((w) => ({
      id: w.id,
      word: w.word,
      meaning: w.meaning,
      phonetic: w.phonetic || '',
    }));
  }
  return [];
}
