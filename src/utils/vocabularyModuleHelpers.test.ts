import { describe, expect, it } from 'vitest';
import {
  estimateFirstPassNodesAndDays,
  stripDuplicateLeadingPhoneticFromMeaning,
} from './vocabularyModuleHelpers';

describe('estimateFirstPassNodesAndDays', () => {
  it('3000 words @ 150/day → 10 nodes × 5 days', () => {
    expect(estimateFirstPassNodesAndDays(3000, 150)).toEqual({ nodes: 10, daysMin: 50 });
  });

  it('3000 words @ 300/day → 5 nodes × 5 days', () => {
    expect(estimateFirstPassNodesAndDays(3000, 300)).toEqual({ nodes: 5, daysMin: 25 });
  });

  it('3000 words @ 1000/day → 2 nodes', () => {
    expect(estimateFirstPassNodesAndDays(3000, 1000)).toEqual({ nodes: 2, daysMin: 10 });
  });

  it('empty book', () => {
    expect(estimateFirstPassNodesAndDays(0, 150)).toEqual({ nodes: 0, daysMin: 0 });
  });
});

describe('stripDuplicateLeadingPhoneticFromMeaning', () => {
  it('removes leading [ipa] when it matches phonetic field', () => {
    expect(
      stripDuplicateLeadingPhoneticFromMeaning(
        '[trəˈdɪʃənl] a. 传统的，惯例的',
        'trəˈdɪʃənl'
      )
    ).toBe('a. 传统的，惯例的');
  });

  it('matches phonetic with slashes', () => {
    expect(
      stripDuplicateLeadingPhoneticFromMeaning('[ˈtrækʃn] n. 牵引', '/ˈtrækʃn/')
    ).toBe('n. 牵引');
  });

  it('supports fullwidth brackets', () => {
    expect(
      stripDuplicateLeadingPhoneticFromMeaning('【ˈmɪnɪməlɪzəm】极简主义', '/ˈmɪnɪməlɪzəm/')
    ).toBe('极简主义');
  });

  it('removes leading /ipa/ when it matches phonetic (slash form next to 释义)', () => {
    expect(
      stripDuplicateLeadingPhoneticFromMeaning(
        "/'krɒnɪk/ a. （疾病）慢性的；积习难改的",
        "'krɒnɪk"
      )
    ).toBe('a. （疾病）慢性的；积习难改的');
  });

  it('matches slash meaning to phonetic with stress vs apostrophe', () => {
    expect(
      stripDuplicateLeadingPhoneticFromMeaning('/ˈkrɒnɪk/ adj. 慢性的', "'krɒnɪk")
    ).toBe('adj. 慢性的');
  });

  it('does not strip when bracket ipa differs from phonetic', () => {
    const s = '[ˈjuːs] n. 使用';
    expect(stripDuplicateLeadingPhoneticFromMeaning(s, '/ˈjuːz/')).toBe(s);
  });

  it('returns empty string for empty meaning', () => {
    expect(stripDuplicateLeadingPhoneticFromMeaning('', '/x/')).toBe('');
  });

  it('leaves meaning unchanged when phonetic is empty', () => {
    const s = '[ˈkɒɡnətɪv] adj. 认知的';
    expect(stripDuplicateLeadingPhoneticFromMeaning(s, '')).toBe(s);
  });
});
