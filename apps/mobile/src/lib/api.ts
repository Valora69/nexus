import { configureApi } from '@repo/core';

import { getStoredToken } from './auth';

/**
 * Point the shared @repo/core data layer at the mobile backend.
 *
 * Unlike web (relative `/api` + cookies), mobile talks to the absolute API
 * origin and authenticates with a bearer token from secure storage. The
 * `onUnauthorized` single-flight handler is wired by AuthProvider (it needs the
 * query cache + auth state), so it's set there rather than here.
 */
configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  credentials: 'omit',
  getToken: getStoredToken,
});
