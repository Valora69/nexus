import { describe, expect, it } from '@jest/globals';

import {
  DEMO_CITIES,
  DEMO_SCENARIOS,
  DEMO_SEED,
  createDemoRng,
  mulberry32,
  nextCity,
  randomDemoExpense,
} from '../lib/landing/simulated';

function take<T>(n: number, next: () => T): T[] {
  return Array.from({ length: n }, next);
}

describe('mulberry32', () => {
  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(DEMO_SEED);
    const b = mulberry32(DEMO_SEED);
    expect(take(50, a)).toEqual(take(50, b));
  });

  it('diverges for different seeds', () => {
    expect(take(10, mulberry32(1))).not.toEqual(take(10, mulberry32(2)));
  });

  it('returns floats in [0, 1)', () => {
    const rng = createDemoRng();
    for (const v of take(1000, rng)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomDemoExpense', () => {
  it('replays the same sequence from the demo seed', () => {
    const first = take(20, () => randomDemoExpense(createDemoRng()));
    const rngA = createDemoRng();
    const rngB = createDemoRng();
    expect(take(20, () => randomDemoExpense(rngA))).toEqual(
      take(20, () => randomDemoExpense(rngB)),
    );
    expect(first.every((e) => e === first[0])).toBe(true);
  });

  it('only returns known scenarios and reaches all of them', () => {
    const rng = createDemoRng();
    const seen = new Set(take(200, () => randomDemoExpense(rng).name));
    expect([...seen].sort()).toEqual(DEMO_SCENARIOS.map((s) => s.name).sort());
  });

  it('never repeats the previous scenario when one is given', () => {
    const rng = createDemoRng();
    let previous = randomDemoExpense(rng);
    const seen = new Set([previous.name]);
    for (let i = 0; i < 500; i++) {
      const next = randomDemoExpense(rng, previous);
      expect(next.name).not.toBe(previous.name);
      seen.add(next.name);
      previous = next;
    }
    expect(seen.size).toBe(DEMO_SCENARIOS.length);
  });

  it('keeps the scenario totals from the spec', () => {
    expect(DEMO_SCENARIOS).toEqual([
      { name: 'Pizza night', total: 1200 },
      { name: 'Grab home', total: 240 },
      { name: 'Milk tea run', total: 390 },
      { name: 'Groceries', total: 3450 },
    ]);
  });
});

describe('nextCity', () => {
  it('has valid coordinates for every city', () => {
    for (const city of DEMO_CITIES) {
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lng).toBeGreaterThanOrEqual(-180);
      expect(city.lng).toBeLessThanOrEqual(180);
      expect(city.weight).toBeGreaterThan(0);
    }
  });

  it('is deterministic and weighted towards the Philippines', () => {
    const picks = take(
      2000,
      (() => {
        const rng = createDemoRng();
        return () => nextCity(rng);
      })(),
    );
    const again = take(
      2000,
      (() => {
        const rng = createDemoRng();
        return () => nextCity(rng);
      })(),
    );
    expect(picks.map((c) => c.name)).toEqual(again.map((c) => c.name));

    const names = new Set<string>(DEMO_CITIES.map((c) => c.name));
    expect(picks.every((c) => names.has(c.name))).toBe(true);

    const phShare =
      picks.filter((c) => c.country === 'PH').length / picks.length;
    expect(phShare).toBeGreaterThan(0.6);
  });

  it('never repeats the previous city when one is given', () => {
    const rng = createDemoRng();
    let previous = nextCity(rng);
    const seen = new Set([previous.name]);
    for (let i = 0; i < 1000; i++) {
      const next = nextCity(rng, previous);
      expect(next.name).not.toBe(previous.name);
      seen.add(next.name);
      previous = next;
    }
    expect(seen.size).toBe(DEMO_CITIES.length);
  });
});
