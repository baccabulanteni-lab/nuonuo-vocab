import { describe, expect, it } from 'vitest';
import {
  buildStudyQueueForPass,
  computeMasteryProgressPercent,
  countNotFullyMasteredFromCorpus,
  getEffectiveStudyPass,
} from './studyPassQueue';

const raw = [
  { id: 'a', word: 'a', meaning: '', phonetic: '' },
  { id: 'b', word: 'b', meaning: '', phonetic: '' },
  { id: 'c', word: 'c', meaning: '', phonetic: '' },
];

describe('getEffectiveStudyPass', () => {
  it('defaults to 1', () => {
    expect(getEffectiveStudyPass({})).toBe(1);
    expect(getEffectiveStudyPass({ studyPass: 0 })).toBe(1);
  });
  it('uses explicit pass', () => {
    expect(getEffectiveStudyPass({ studyPass: 2 })).toBe(2);
  });
});

describe('buildStudyQueueForPass', () => {
  it('pass 1 returns full raw order', () => {
    expect(buildStudyQueueForPass(raw, [], 1, 'bk')).toEqual(raw);
  });
  it('pass 2 drops familiar_100 and keeps stable order for same seed', () => {
    const bw = [{ id: 'a', status: 'familiar_100' as const }];
    const q = buildStudyQueueForPass(raw, bw, 2, 'bk');
    expect(q).toHaveLength(2);
    expect(q.every((x) => x.id !== 'a')).toBe(true);
    const q2 = buildStudyQueueForPass(raw, bw, 2, 'bk');
    expect(q.map((x) => x.id)).toEqual(q2.map((x) => x.id));
  });
});

describe('countNotFullyMasteredFromCorpus', () => {
  it('treats missing ids as new', () => {
    expect(countNotFullyMasteredFromCorpus(raw, [])).toBe(3);
  });
  it('excludes familiar_100', () => {
    expect(
      countNotFullyMasteredFromCorpus(raw, [
        { id: 'a', status: 'familiar_100' },
        { id: 'b', status: 'familiar_70' },
      ])
    ).toBe(2);
  });
});

describe('computeMasteryProgressPercent', () => {
  it('computes ratio', () => {
    expect(computeMasteryProgressPercent([{ id: 'a', status: 'familiar_100' }], 4)).toBe(25);
  });
});
