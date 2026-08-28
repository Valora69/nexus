// Request DTOs live in `@repo/shared` so the mobile app can send the exact
// same payload shapes. This shim keeps `@web/lib/types/request` imports valid.
export * from '@repo/shared/types/request';
