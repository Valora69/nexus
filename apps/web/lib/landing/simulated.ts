/**
 * Simulated data for the landing page demos (coin key, globe, nav counter).
 * Everything shown from here is labeled "demo" on the page: there is no
 * backend, database or API behind it.
 *
 * All generators are pure: they take a seeded RNG, so tests are
 * deterministic. Create the RNG in an effect or ref, never during render.
 */

export type Rng = () => number;

/** Constant seed ("Mony") so every visit plays the same demo sequence. */
export const DEMO_SEED = 0x4d6f6e79;

/** mulberry32: a tiny, fast, seedable PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDemoRng(seed: number = DEMO_SEED): Rng {
  return mulberry32(seed);
}

function pickIndex(rng: Rng, length: number): number {
  return Math.min(Math.floor(rng() * length), length - 1);
}

export type DemoScenario = { name: string; total: number };

export const DEMO_SCENARIOS = [
  { name: 'Pizza night', total: 1200 },
  { name: 'Grab home', total: 240 },
  { name: 'Milk tea run', total: 390 },
  { name: 'Groceries', total: 3450 },
] as const satisfies readonly DemoScenario[];

export function randomDemoExpense(rng: Rng): DemoScenario {
  return (
    DEMO_SCENARIOS[pickIndex(rng, DEMO_SCENARIOS.length)] ?? DEMO_SCENARIOS[0]
  );
}

export type DemoCity = {
  name: string;
  country: string;
  lat: number;
  lng: number;
  /** Relative pick weight; Philippine cities dominate. */
  weight: number;
};

export const DEMO_CITIES = [
  { name: 'Manila', country: 'PH', lat: 14.5995, lng: 120.9842, weight: 5 },
  { name: 'Quezon City', country: 'PH', lat: 14.676, lng: 121.0437, weight: 4 },
  { name: 'Cebu', country: 'PH', lat: 10.3157, lng: 123.8854, weight: 4 },
  { name: 'Davao', country: 'PH', lat: 7.1907, lng: 125.4553, weight: 3 },
  { name: 'Iloilo', country: 'PH', lat: 10.7202, lng: 122.5621, weight: 2 },
  { name: 'Singapore', country: 'SG', lat: 1.3521, lng: 103.8198, weight: 1 },
  { name: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, weight: 1 },
  { name: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708, weight: 1 },
  {
    name: 'Los Angeles',
    country: 'US',
    lat: 34.0522,
    lng: -118.2437,
    weight: 1,
  },
] as const satisfies readonly DemoCity[];

const TOTAL_CITY_WEIGHT = DEMO_CITIES.reduce((sum, c) => sum + c.weight, 0);

/** Weighted pick from DEMO_CITIES. */
export function nextCity(rng: Rng): DemoCity {
  let roll = rng() * TOTAL_CITY_WEIGHT;
  for (const city of DEMO_CITIES) {
    roll -= city.weight;
    if (roll < 0) return city;
  }
  return DEMO_CITIES[DEMO_CITIES.length - 1] ?? DEMO_CITIES[0];
}

/** Starting value of the "₱ … split · demo" nav counter. */
export const COUNTER_BASE = 12408550;

export const COUNTER_STEP_MIN = 120;
export const COUNTER_STEP_MAX = 2400;

/** One simulated tick of pesos split: a whole ₱10 amount in [min, max]. */
export function nextCounterStep(rng: Rng): number {
  const raw = COUNTER_STEP_MIN + rng() * (COUNTER_STEP_MAX - COUNTER_STEP_MIN);
  return Math.round(raw / 10) * 10;
}
