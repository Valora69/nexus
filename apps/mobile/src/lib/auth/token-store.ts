/**
 * Persistent, encrypted storage for the auth JWT and the last-known user
 * profile. Uses `expo-secure-store` (Keychain on iOS, Keystore on Android).
 *
 * The user payload is cached alongside the token so the app can render an
 * optimistic authenticated shell on cold-start while the token is
 * revalidated against `/api/auth/profile`.
 */

import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function saveUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
}
