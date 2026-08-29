/**
 * Mirror of the JWT payload returned by `/api/auth/profile`. The web
 * `AuthUser` in `apps/web/lib/server/auth.ts` is the source of truth.
 */
export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

/** Payload returned by `POST /api/auth/google/mobile`. */
export interface MobileSignInResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string | null;
  };
}
