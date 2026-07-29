/**
 * Platform-agnostic API configuration.
 *
 * The defaults reproduce the web app's original behaviour exactly — a relative
 * `/api` base and cookie credentials — so `apps/web` needs no configuration.
 * `apps/mobile` calls `configureApi()` once at startup to point at the absolute
 * API origin and supply a bearer token from secure storage instead of cookies.
 */
export interface ApiConfig {
  /** Prepended to every request path. Web: `/api`. Mobile: `https://<host>/api`. */
  baseUrl: string;
  /** Web uses `include` (cookies). Mobile uses `omit` (bearer token instead). */
  credentials: RequestCredentials;
  /** Returns the bearer token, or null when unauthenticated. Web returns null. */
  getToken: () => string | null | Promise<string | null>;
  /** Called on any 401. Wire single-flight session-expiry here (mobile). */
  onUnauthorized?: () => void;
  /** Extra headers added to every request (e.g. X-App-Version / X-Platform). */
  meta?: () => Record<string, string>;
}

let config: ApiConfig = {
  baseUrl: '/api',
  credentials: 'include',
  getToken: () => null,
};

/** Override any subset of the API config. Call once at app startup. */
export function configureApi(partial: Partial<ApiConfig>): void {
  config = { ...config, ...partial };
}

export function getApiConfig(): ApiConfig {
  return config;
}
