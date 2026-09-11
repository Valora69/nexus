/**
 * Build an Error from a failed fetch, preferring the server's
 * `{ message }` body (NestJS-shaped, see `lib/server/errors.ts`) so
 * business-rule errors like the payment lock reach the toast verbatim.
 */
export async function responseError(
  res: Response,
  fallback: string,
): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = Array.isArray(body?.message)
    ? body.message.join('; ')
    : body?.message;
  return new Error(
    typeof message === 'string' && message
      ? message
      : `${fallback}: ${res.statusText}`,
  );
}
