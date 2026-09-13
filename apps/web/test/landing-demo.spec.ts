import { describe, it, expect } from '@jest/globals';

import {
  DEMO_CURRENT_USER,
  DEMO_EXPENSE,
  DEMO_MEMBERS,
  customValidity,
  demoSplitStatus,
  equalShares,
  formatPeso,
} from '../lib/landing/demo';
import { parseGroupCapture } from '../lib/quick-capture/parseGroupCapture';

describe('equalShares', () => {
  it('divides the total evenly like the create-expense modal', () => {
    expect(equalShares(1200, 3)).toEqual([400, 400, 400]);
  });

  it('keeps the product float math (no centavo reallocation)', () => {
    const shares = equalShares(100, 3);
    expect(shares.map((s) => s.toFixed(2))).toEqual([
      '33.33',
      '33.33',
      '33.33',
    ]);
  });

  it('handles no participants and a zero total', () => {
    expect(equalShares(1200, 0)).toEqual([]);
    expect(equalShares(0, 2)).toEqual([0, 0]);
  });
});

describe('customValidity', () => {
  it('is valid when assigned amounts match the total', () => {
    expect(
      customValidity(1200, { me: '400', james: '400', mika: 400 }),
    ).toEqual({
      assigned: 1200,
      isValid: true,
      excludedCount: 0,
      activeIds: ['me', 'james', 'mika'],
    });
  });

  it('is invalid when amounts do not match', () => {
    const result = customValidity(1200, {
      me: '500',
      james: '400',
      mika: '200',
    });
    expect(result.assigned).toBe(1100);
    expect(result.isValid).toBe(false);
  });

  it('tolerates sub-cent differences', () => {
    expect(
      customValidity(1200, { me: '400.004', james: '400', mika: '399.999' })
        .isValid,
    ).toBe(true);
  });

  it('mirrors the modal float check: ₱33.33 × 3 does not satisfy ₱100', () => {
    // 100 - 99.99 is a hair over 0.01 in floating point, so the real
    // create-expense modal rejects this too. Kept identical on purpose.
    expect(
      customValidity(100, { me: '33.33', james: '33.33', mika: '33.33' })
        .isValid,
    ).toBe(false);
  });

  it('excludes zero and blank shares', () => {
    const result = customValidity(1200, { me: '600', james: '600', mika: '0' });
    expect(result.isValid).toBe(true);
    expect(result.excludedCount).toBe(1);
    expect(customValidity(1200, { me: '1200', james: '' }).excludedCount).toBe(
      1,
    );
  });

  it('is invalid when everyone is excluded', () => {
    expect(customValidity(0, { me: '0', james: '' }).isValid).toBe(false);
  });
});

describe('demoSplitStatus', () => {
  it('walks unpaid → pending → paid through the real splitStatus', () => {
    expect(demoSplitStatus('unpaid', 400)).toBe('unpaid');
    expect(demoSplitStatus('pending', 400)).toBe('pending');
    expect(demoSplitStatus('paid', 400)).toBe('paid');
  });
});

describe('demo members', () => {
  it('drive the real capture parser outcomes used by the landing demo', () => {
    const parse = (raw: string) =>
      parseGroupCapture(raw, DEMO_MEMBERS, DEMO_CURRENT_USER.userId);

    expect(parse('450 dinner ced')).toMatchObject({
      ok: true,
      data: { direction: 'paid', amount: 450, memberName: 'Ced' },
    });
    expect(parse('-450 dinner ced')).toMatchObject({
      ok: true,
      data: { direction: 'owes', memberName: 'Ced' },
    });
    // First-name prefix match: "gl" is Glenn; nobody is called Zed.
    expect(parse('450 dinner gl')).toMatchObject({
      ok: true,
      data: { memberName: 'Glenn' },
    });
    expect(parse('450 dinner zed')).toMatchObject({
      ok: false,
      error: { kind: 'NO_MATCH', token: 'zed' },
    });
  });

  it('starts with the payer among the participants', () => {
    expect(DEMO_EXPENSE.participantIds).toContain(DEMO_EXPENSE.payerId);
  });
});

describe('formatPeso', () => {
  it('formats with thousands separators and two decimals', () => {
    expect(formatPeso(1200)).toBe('₱1,200.00');
    expect(formatPeso(33.333)).toBe('₱33.33');
    expect(formatPeso(1234567.5)).toBe('₱1,234,567.50');
    expect(formatPeso(-450)).toBe('-₱450.00');
  });
});
