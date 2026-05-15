/**
 * Parses a group-context quick-capture string into a directed debt entry.
 *
 * Grammar:
 *   "50 grab james"   → user paid 50 for "grab", James owes the user (RECEIVABLE)
 *   "-50 grab james"  → James paid 50 for "grab", user owes James (PAYABLE)
 *
 * Token layout (after stripping sign and currency):
 *   tokens[0]                = amount
 *   tokens[1..n-2]           = description (joined with spaces)
 *   tokens[n-1]              = member reference (first-name prefix match)
 *
 * Member resolution is case-insensitive prefix match on first name. The current
 * user is excluded from the candidate pool. Ambiguous matches return an error.
 */

export type GroupCaptureMember = {
  userId: string;
  name: string;
};

export type GroupCaptureDirection = 'paid' | 'owes';

export type ParsedGroupCapture = {
  direction: GroupCaptureDirection;
  amount: number;
  description: string;
  memberId: string;
  memberName: string;
};

export type GroupCaptureError =
  | { kind: 'EMPTY' }
  | { kind: 'INVALID_AMOUNT'; token: string }
  | { kind: 'MISSING_MEMBER' }
  | { kind: 'NO_MATCH'; token: string }
  | { kind: 'AMBIGUOUS_MATCH'; token: string; candidates: string[] };

export type GroupCaptureResult =
  | { ok: true; data: ParsedGroupCapture }
  | { ok: false; error: GroupCaptureError };

function firstName(fullName: string): string {
  return (fullName.split(/\s+/)[0] ?? '').toLowerCase();
}

export function parseGroupCapture(
  raw: string,
  members: GroupCaptureMember[],
  currentUserId: string,
): GroupCaptureResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: { kind: 'EMPTY' } };

  // Detect direction from leading sign
  const isNegative = trimmed.startsWith('-');
  const direction: GroupCaptureDirection = isNegative ? 'owes' : 'paid';

  const cleaned = trimmed
    .replace(/^[-+]/, '')
    .replace(/^(PHP|php|\$|₱)\s*/i, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: { kind: 'EMPTY' } };

  const amountRaw = (tokens[0] ?? '').replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountRaw);
  if (!isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      error: { kind: 'INVALID_AMOUNT', token: tokens[0] ?? '' },
    };
  }

  if (tokens.length < 2) {
    return { ok: false, error: { kind: 'MISSING_MEMBER' } };
  }

  const memberToken = (tokens[tokens.length - 1] ?? '').toLowerCase();
  const description = tokens.slice(1, -1).join(' ').trim();

  const candidates = members
    .filter((m) => m.userId !== currentUserId)
    .filter((m) => firstName(m.name).startsWith(memberToken));

  if (candidates.length === 0) {
    return {
      ok: false,
      error: { kind: 'NO_MATCH', token: memberToken },
    };
  }
  if (candidates.length > 1) {
    return {
      ok: false,
      error: {
        kind: 'AMBIGUOUS_MATCH',
        token: memberToken,
        candidates: candidates.map((c) => c.name),
      },
    };
  }

  const matched = candidates[0]!;
  return {
    ok: true,
    data: {
      direction,
      amount,
      description: description || 'Group expense',
      memberId: matched.userId,
      memberName: matched.name,
    },
  };
}

export function formatGroupCaptureError(err: GroupCaptureError): string {
  switch (err.kind) {
    case 'EMPTY':
      return 'Type an amount and member name';
    case 'INVALID_AMOUNT':
      return `Invalid amount: "${err.token}"`;
    case 'MISSING_MEMBER':
      return 'Missing member name (last token)';
    case 'NO_MATCH':
      return `No member matches "${err.token}"`;
    case 'AMBIGUOUS_MATCH':
      return `"${err.token}" matches ${err.candidates.join(', ')} — be more specific`;
  }
}
