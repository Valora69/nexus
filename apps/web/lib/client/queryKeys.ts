// Query-key registry lives in `@repo/shared` so web and mobile invalidate
// the same cache keys. Shim for existing `@web/lib/client/queryKeys` imports.
export * from '@repo/shared/queryKeys';
