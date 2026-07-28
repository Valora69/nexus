import { configureApi } from '@repo/core';

/**
 * Point the shared @repo/core data layer at the mobile backend.
 *
 * Unlike web (relative `/api` + cookies), mobile talks to the absolute API
 * origin and authenticates with a bearer token instead of cookies. The token
 * getter is a stub for now — Milestone 2 wires it to expo-secure-store, and
 * sets `onUnauthorized` for single-flight session expiry.
 */
configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  credentials: 'omit',
  getToken: async () => null,
});
