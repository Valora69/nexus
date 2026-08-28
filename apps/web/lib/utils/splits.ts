// Split-settlement math lives in `@repo/shared` so both apps compute
// settled/unsettled from verified payments the same way. Shim for web imports.
export * from '@repo/shared/utils/splits';
