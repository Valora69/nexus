/**
 * Idempotency-Key header parsing for mobile offline-outbox replays
 * (stage 12). The mobile client generates a UUIDv4 per outbox row and
 * sends it verbatim; on the wire we just need "a short opaque string that
 * uniquely identifies this write intent." We validate lightly rather than
 * insisting on UUID shape — a future non-mobile caller (integration
 * webhook, background job replay) can reuse the same contract without
 * being forced into UUID formatting.
 *
 * A missing / blank / oversized header returns `undefined`, so calling
 * services can treat "no key" as "no idempotency requested" — the fast
 * path for every web-originated write.
 */

import type { NextRequest } from 'next/server';

const MAX_LEN = 128;
// Ordinary printable ASCII, no whitespace. Rejects control chars and
// anything that could smuggle newline injection into logs.
const VALID = /^[A-Za-z0-9._~:@!$&'()*+,;=/?#\[\]%-]{1,128}$/;

export function readIdempotencyKey(req: NextRequest): string | undefined {
  const raw = req.headers.get('idempotency-key');
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LEN) return undefined;
  if (!VALID.test(trimmed)) return undefined;
  return trimmed;
}
