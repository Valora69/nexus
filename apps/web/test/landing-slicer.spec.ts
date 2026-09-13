import { describe, expect, it } from '@jest/globals';

import {
  SLICE_STEP,
  dividerBounds,
  equalDividers,
  moveDivider,
  sharesFromDividers,
  snapToStep,
} from '../lib/landing/demo';

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('snapToStep', () => {
  it('rounds to the nearest ₱10', () => {
    expect(SLICE_STEP).toBe(10);
    expect(snapToStep(404)).toBe(400);
    expect(snapToStep(405)).toBe(410);
    expect(snapToStep(-4)).toBe(-0);
    expect(snapToStep(123, 25)).toBe(125);
  });

  it('leaves the value alone for a non-positive step', () => {
    expect(snapToStep(123.4, 0)).toBe(123.4);
  });
});

describe('sharesFromDividers', () => {
  it('turns cumulative divider positions into shares', () => {
    expect(sharesFromDividers(1200, [400, 800])).toEqual([400, 400, 400]);
    expect(sharesFromDividers(1200, [250, 1000])).toEqual([250, 750, 200]);
  });

  it('gives one person the whole bill without dividers', () => {
    expect(sharesFromDividers(1200, [])).toEqual([1200]);
  });

  it('clamps out-of-range and out-of-order dividers, never going negative', () => {
    expect(sharesFromDividers(1200, [-50, 1500])).toEqual([0, 1200, 0]);
    expect(sharesFromDividers(1200, [900, 300])).toEqual([900, 0, 300]);
  });

  it('always adds up to exactly the total', () => {
    const cases: [number, number[]][] = [
      [1200, [400, 800]],
      [1000, [333.33, 666.67]],
      [390, [10, 20, 380]],
      [3450, [5000, -10, 1200]],
      [240, [120.5]],
    ];
    for (const [total, dividers] of cases) {
      const shares = sharesFromDividers(total, dividers);
      expect(shares).toHaveLength(dividers.length + 1);
      expect(sum(shares)).toBeCloseTo(total, 10);
      expect(shares.every((s) => s >= 0)).toBe(true);
    }
  });
});

describe('equalDividers', () => {
  it('splits evenly on the ₱10 grid', () => {
    expect(equalDividers(1200, 3)).toEqual([400, 800]);
    expect(sharesFromDividers(1200, equalDividers(1200, 4))).toEqual([
      300, 300, 300, 300,
    ]);
  });

  it('snaps an uneven split and the last person absorbs the difference', () => {
    const dividers = equalDividers(1000, 3);
    expect(dividers).toEqual([330, 670]);
    expect(sharesFromDividers(1000, dividers)).toEqual([330, 340, 330]);
  });

  it('needs no dividers for one person or none', () => {
    expect(equalDividers(1200, 1)).toEqual([]);
    expect(equalDividers(1200, 0)).toEqual([]);
  });
});

describe('dividerBounds and moveDivider', () => {
  it('keeps each divider a step away from its neighbours and the ends', () => {
    expect(dividerBounds(1200, [400, 800], 0)).toEqual({ min: 10, max: 790 });
    expect(dividerBounds(1200, [400, 800], 1)).toEqual({ min: 410, max: 1190 });
  });

  it('snaps a dragged position to ₱10', () => {
    expect(moveDivider(1200, [400, 800], 0, 523.7)).toEqual([520, 800]);
  });

  it('clamps so nobody drops below one step', () => {
    expect(moveDivider(1200, [400, 800], 0, 5000)).toEqual([790, 800]);
    expect(moveDivider(1200, [400, 800], 1, -20)).toEqual([400, 410]);
    expect(moveDivider(1200, [400, 800], 0, 0)).toEqual([10, 800]);
  });

  it('returns a new array and ignores unknown indexes', () => {
    const dividers = [400, 800];
    expect(moveDivider(1200, dividers, 0, 420)).not.toBe(dividers);
    expect(dividers).toEqual([400, 800]);
    expect(moveDivider(1200, dividers, 5, 100)).toBe(dividers);
  });

  it('keeps the total consistent across a run of arrow-key steps', () => {
    let dividers = equalDividers(1200, 3);
    for (let i = 0; i < 60; i++) {
      const index = i % 2;
      const current = dividers[index] ?? 0;
      dividers = moveDivider(
        1200,
        dividers,
        index,
        current + (i % 3 === 0 ? -SLICE_STEP : SLICE_STEP),
      );
      const shares = sharesFromDividers(1200, dividers);
      expect(sum(shares)).toBe(1200);
      expect(Math.min(...shares)).toBeGreaterThanOrEqual(SLICE_STEP);
      expect(shares.every((s) => s % SLICE_STEP === 0)).toBe(true);
    }
  });
});
