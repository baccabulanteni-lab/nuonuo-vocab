import { describe, it, expect } from 'vitest';
import { buildCycleBatchesFromQueue } from './wordCycleSchedule';

describe('buildCycleBatchesFromQueue', () => {
  const q = Array.from({ length: 5 }, (_, i) => ({
    id: `w${i}`,
    word: `word${i}`,
    meaning: '',
    phonetic: '',
  }));

  it('按 daily 切批并交替循环日', () => {
    const batches = buildCycleBatchesFromQueue(q, 2);
    expect(batches).toHaveLength(3);
    expect(batches[0].introCycleDay).toBe(1);
    expect(batches[0].part).toBe('A');
    expect(batches[0].items).toHaveLength(2);
    expect(batches[1].introCycleDay).toBe(3);
    expect(batches[1].part).toBe('B');
    expect(batches[2].introCycleDay).toBe(1);
    expect(batches[2].items).toHaveLength(1);
  });

  it('fiveDayNodeIndex1 每两批进一节点', () => {
    const batches = buildCycleBatchesFromQueue(q, 2);
    expect(batches[0].fiveDayNodeIndex1).toBe(1);
    expect(batches[1].fiveDayNodeIndex1).toBe(1);
    expect(batches[2].fiveDayNodeIndex1).toBe(2);
  });
});
