/**
 * Networking primitive used by every service/query hook in the app.
 *
 * - Reads the base URL from `EXPO_PUBLIC_API_URL` (falls back to prod).
 * - Injects `Authorization: Bearer <token>` via an injected getter so this
 *   module never imports the auth context (which imports the client).
 * - Parses the NestJS error shape `{ statusCode, message, error }` and
 *   throws a typed `ApiError` matching web's server errors.
 * - Emits an `onUnauthorized` event on 401 so the auth context can sign the
 *   user out — again via a subscription rather than an import cycle.
 */

const DEFAULT_BASE_URL = 'https://moneyapp.click';

// Trim trailing slash so `${base}/api/...` never doubles up.
const RAW_BASE = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
const BASE_URL = RAW_BASE.replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type TokenGetter = () => string | null | Promise<string | null>;
type UnauthorizedListener = () => void;

let tokenGetter: TokenGetter = () => null;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function setAuthTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function emitUnauthorized() {
  for (const listener of unauthorizedListeners) {
    try {
      listener();
    } catch (err) {
      console.warn('[apiFetch] onUnauthorized listener threw', err);
    }
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** JSON-serializable body. Sets `Content-Type: application/json`. */
  json?: unknown;
  /** Raw body — takes precedence over `json`. */
  body?: BodyInit | null;
  /** Skip Bearer injection (used by `/api/auth/google/mobile`). */
  auth?: false;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(opts.headers);
  if (opts.json !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  if (opts.auth !== false) {
    const token = await tokenGetter();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...opts,
    headers,
    body: opts.body ?? (opts.json !== undefined ? JSON.stringify(opts.json) : undefined),
  });

  if (res.status === 401) {
    emitUnauthorized();
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray((payload as { message: unknown }).message)
          ? ((payload as { message: string[] }).message.join('; '))
          : String((payload as { message: unknown }).message)
        : null) ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const API_BASE_URL = BASE_URL;
