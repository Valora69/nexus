/**
 * The landing page's shared Quick Add counter: every press of the hero's Q
 * keycap, from every visitor. Shared by the nav pill (client) and
 * `app/api/landing/quick-adds` (server), so it stays free of server imports.
 */

export const QUICK_ADDS_ENDPOINT = '/api/landing/quick-adds';

/** Counter row key in the LandingCounter table. */
export const QUICK_ADDS_KEY = 'quick-adds';

/** Most presses one request may report. */
export const QUICK_ADD_MAX_BATCH = 50;

/** Most presses one visitor (by IP) may add per window. */
export const QUICK_ADD_RATE_LIMIT = 600;
export const QUICK_ADD_RATE_WINDOW_MS = 60_000;

/** The count from an endpoint response, or null if it isn't one. */
export function readQuickAddCount(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) return null;
  const count = (body as { count?: unknown }).count;
  return typeof count === 'number' && Number.isFinite(count) && count >= 0
    ? count
    : null;
}

type Window = { start: number; used: number };

/**
 * A fixed-window press budget per visitor. Spamming Q still counts, up to
 * `limit` presses per window; the rest are dropped. In-memory, so on
 * serverless each warm instance keeps its own budget: it stops casual
 * scripts, not a determined attacker.
 */
export function createPressLimiter(
  limit: number = QUICK_ADD_RATE_LIMIT,
  windowMs: number = QUICK_ADD_RATE_WINDOW_MS,
  maxVisitors = 10_000,
) {
  const windows = new Map<string, Window>();

  /** How many of `presses` this visitor may add now. */
  return function allow(visitor: string, presses: number, now: number): number {
    let entry = windows.get(visitor);
    if (!entry || now - entry.start >= windowMs) {
      if (!entry && windows.size >= maxVisitors) {
        for (const [key, w] of windows) {
          if (now - w.start >= windowMs) windows.delete(key);
        }
        // Still full of active visitors: forget the oldest one.
        if (windows.size >= maxVisitors) {
          const oldest = windows.keys().next().value;
          if (oldest !== undefined) windows.delete(oldest);
        }
      }
      entry = { start: now, used: 0 };
      windows.delete(visitor);
      windows.set(visitor, entry);
    }
    const allowed = Math.max(0, Math.min(presses, limit - entry.used));
    entry.used += allowed;
    return allowed;
  };
}
