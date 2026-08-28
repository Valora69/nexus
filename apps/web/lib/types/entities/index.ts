// Types live in `@repo/shared` so the mobile app can consume them without
// duplication. Keep this file as a shim so existing `@web/lib/types/entities`
// import paths continue to work; the actual definitions are one edit away.
export * from '@repo/shared/types/entities';
