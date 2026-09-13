import { describe, expect, it } from '@jest/globals';

import {
  createPressLimiter,
  readQuickAddCount,
} from '../lib/landing/quick-adds';

describe('readQuickAddCount', () => {
  it('reads a non-negative count and rejects anything else', () => {
    expect(readQuickAddCount({ count: 12 })).toBe(12);
    expect(readQuickAddCount({ count: 0, accepted: 0 })).toBe(0);
    expect(readQuickAddCount({ count: -1 })).toBeNull();
    expect(readQuickAddCount({ count: '12' })).toBeNull();
    expect(readQuickAddCount([])).toBeNull();
    expect(readQuickAddCount(null)).toBeNull();
  });
});

describe('createPressLimiter', () => {
  it('lets a visitor spam up to the limit per window, then drops the rest', () => {
    const allow = createPressLimiter(10, 1000);
    expect(allow('a', 6, 0)).toBe(6);
    expect(allow('a', 6, 100)).toBe(4);
    expect(allow('a', 1, 200)).toBe(0);
    // Other visitors have their own budget.
    expect(allow('b', 10, 200)).toBe(10);
    // A new window resets it.
    expect(allow('a', 3, 1000)).toBe(3);
  });

  it('keeps its memory bounded', () => {
    const allow = createPressLimiter(5, 1000, 2);
    allow('a', 5, 0);
    allow('b', 5, 0);
    // Full of active visitors: the oldest is forgotten to make room.
    expect(allow('c', 5, 10)).toBe(5);
    expect(allow('b', 1, 10)).toBe(0);
    expect(allow('a', 5, 10)).toBe(5);
  });
});
