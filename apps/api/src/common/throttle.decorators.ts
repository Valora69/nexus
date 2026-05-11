import { Throttle, SkipThrottle } from '@nestjs/throttler';

/**
 * 10 requests / 60 s — for auth endpoints (OAuth, logout)
 */
export const ThrottleAuth = () => Throttle({ auth: { limit: 10, ttl: 60_000 } });

/**
 * 30 requests / 60 s — for write endpoints (create, update, delete)
 */
export const ThrottleWrite = () => Throttle({ write: { limit: 30, ttl: 60_000 } });

export { SkipThrottle };
