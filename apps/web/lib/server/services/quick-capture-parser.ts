import { PersonalTransactionType } from '@prisma/client';

export interface ParsedCapture {
  type: PersonalTransactionType;
  amount: number;
  description: string | null;
  category: string | null;
  source: string | null;
}

export function parseQuickCapture(raw: string): ParsedCapture {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Input is empty');
  const isCredit = trimmed.startsWith('+');
  const type = isCredit
    ? PersonalTransactionType.CREDIT
    : PersonalTransactionType.EXPENSE;
  const cleaned = trimmed.replace(/^\+/, '').replace(/^(PHP|php|\$|₱)\s*/i, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const firstToken = tokens[0];
  if (!firstToken) throw new Error('Input is empty');
  const amountRaw = firstToken.replace(/[^0-9.]/g, '');
  const amount = parseFloat(amountRaw);
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Could not parse a valid amount from "${firstToken}"`);
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
