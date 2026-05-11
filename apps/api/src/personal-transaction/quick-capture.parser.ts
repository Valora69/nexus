import { PersonalTransactionType } from '@prisma/client';

export interface ParsedCapture {
  type: PersonalTransactionType;
  amount: number;
  description: string | null;
  category: string | null;
  source: string | null;
}

/**
 * Parses a quick-capture string into a structured transaction.
 *
 * Formats:
 *   "50 grab chowking"   → EXPENSE, amount=50, category="grab", description="chowking"
 *   "+50 gcash glenn"    → CREDIT,  amount=50, source="gcash",  description="glenn"
 *   "100"                → EXPENSE, amount=100, no metadata
 *   "+200 gcash"         → CREDIT,  amount=200, source="gcash"
 *
 * Rules:
 *   - Leading "+" → CREDIT; no "+" → EXPENSE
 *   - First token is always the amount (strips +, $, ₱, PHP, php)
 *   - EXPENSE: token[1]=category, token[2]=description/merchant
 *   - CREDIT:  token[1]=source (payment method), token[2]=sender name
 */
export function parseQuickCapture(raw: string): ParsedCapture {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Input is empty');

  const isCredit = trimmed.startsWith('+');
  const type = isCredit ? PersonalTransactionType.CREDIT : PersonalTransactionType.EXPENSE;

  // Strip leading + then currency symbols, then split on whitespace
  const cleaned = trimmed.replace(/^\+/, '').replace(/^(PHP|php|\$|₱)\s*/i, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  const amountRaw = tokens[0].replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Could not parse a valid amount from "${tokens[0]}"`);
  }

  const rest = tokens.slice(1).map((t) => t.toLowerCase());

  if (type === PersonalTransactionType.EXPENSE) {
    return {
      type,
      amount,
      category: rest[0] ?? null,
      description: rest[1] ?? null,
      source: null,
    };
  } else {
    return {
      type,
      amount,
      source: rest[0] ?? null,
      description: rest[1] ?? null,
      category: null,
    };
  }
}
