import { getApiConfig } from './config';

/**
 * Structured API error. The backend error contract is
 * `{ error: { code, message, details } }` (see server `toErrorResponse`), but
 * some legacy routes still return `{ statusCode, message }`. `ApiError.from`
 * tolerates both and always preserves the HTTP `status` so callers can branch
 * on 401/403/404/409/422/429/5xx.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static async from(res: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // Non-JSON error body — fall back to statusText.
    }
    const b = body as
      | { error?: { code?: string; message?: string; details?: unknown }; message?: string }
      | null;
    const message =
      b?.error?.message ?? b?.message ?? res.statusText ?? 'Request failed';
    return new ApiError(res.status, message, b?.error?.code, b?.error?.details);
  }
}

/**
 * `fetch`, with the configured base URL, credentials mode, and (mobile) bearer
 * token injected. Returns the raw `Response` so callers keep full control over
 * status/`.json()`/custom error handling — a drop-in for the services' original
 * `fetch(...)` calls.
 */
export async function http(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { baseUrl, credentials, getToken, onUnauthorized, meta } =
    getApiConfig();
  const token = await getToken();

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(meta ? meta() : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) onUnauthorized?.();
  return res;
}
