import { z } from 'zod';
import { ApiError } from './errors';

/**
 * Parse and validate a request body against a zod schema.
 * On failure, throws an ApiError(400) with a message array matching
 * the NestJS ValidationPipe output shape.
 *
 * Zod's default strip mode matches NestJS's `whitelist: true` (unknown
 * keys are silently removed).
 */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join('.')} ${i.message}`,
    );
    throw new ApiError(400, messages);
  }
  return result.data;
}

/**
 * Parse query parameters from a URLSearchParams against a zod schema.
 * Converts the params to a plain object first so z.coerce works.
 */
export function parseQuery<T>(
  schema: z.ZodType<T>,
  searchParams: URLSearchParams,
): T {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map(
      (i) => `${i.path.join('.')} ${i.message}`,
    );
    throw new ApiError(400, messages);
  }
  return result.data;
}
