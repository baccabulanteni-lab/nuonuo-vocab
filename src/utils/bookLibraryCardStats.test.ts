import { describe, it, expect } from 'vitest';
import { formatBookEtaRemainingDays } from './bookLibraryCardStats';

describe('formatBookEtaRemainingDays', () => {
  it('已通关', () => {
    expect(formatBookEtaRemainingDays(100, 100, 150)).toBe('已通关');
  });

  it('未立约', () => {
    expect(formatBookEtaRemainingDays(3000, 10, null)).toBe('未立约');
    expect(formatBookEtaRemainingDays(3000, 10, undefined)).toBe('未立约');
  });

  it('按剩余比例粗算天数', () => {
    expect(formatBookEtaRemainingDays(1000, 0, 100)).toBe('约 10 天');
    expect(formatBookEtaRemainingDays(1000, 50, 100)).toBe('约 5 天');
    expect(formatBookEtaRemainingDays(1000, 99, 100)).toBe('约 1 天');
  });
});
