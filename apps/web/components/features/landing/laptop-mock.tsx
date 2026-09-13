'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserPlus } from 'lucide-react';

import {
  DEMO_CURRENT_USER,
  DEMO_MEMBERS,
  customValidity,
  equalShares,
  formatPeso,
} from '@web/lib/landing/demo';
import type { DemoScenario } from '@web/lib/landing/simulated';
import { cn } from '@web/lib/utils';

import { HandNote } from './hand-note';
import { useLandingSound } from './sound-provider';

export type LedgerRow = {
  id: string;
  name: string;
  total: number;
  payer: string;
  /** Added by the visitor (the newest one gets a "new" tag). */
  isNew?: boolean;
};

type SplitMode = 'equal' | 'custom';

const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;

/** How the signed-in demo account is labeled, like a real profile name. */
const CURRENT_USER_NAME = 'Sam';

const isCurrentUser = (userId: string) => userId === DEMO_CURRENT_USER.userId;

function memberName(userId: string, name: string) {
  return isCurrentUser(userId) ? CURRENT_USER_NAME : name;
}

// Custom split preset: friends get ₱10-rounded shares (Mara gets nothing, so
// "Excluded" shows up) and the payer takes the rest, so the whole group always
// adds up to the total.
const CUSTOM_WEIGHTS: Record<string, number> = {
  james: 0.35,
  mika: 0.25,
  mara: 0,
};

function customPreset(total: number): Record<string, number> {
  const shares: Record<string, number> = {};
  let assigned = 0;
  for (const [userId, weight] of Object.entries(CUSTOM_WEIGHTS)) {
    const share = Math.round((total * weight) / 10) * 10;
    shares[userId] = share;
    assigned += share;
  }
  shares[DEMO_CURRENT_USER.userId] = total - assigned;
  return shares;
}

function Field({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-medium text-muted">{label}</p>
      <div
        className={cn(
          'flex h-7 items-center truncate rounded-lg border border-border bg-black px-2.5 text-[12px]',
          mono && 'font-mono tabular-nums',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function MiniBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-1.5 py-px font-mono text-[8px] uppercase tracking-[0.08em]',
        className,
      )}
    >
      {children}
    </span>
  );
}

type LaptopMockProps = {
  rows: LedgerRow[];
  /** The expense shown in the Add Expense panel. */
  expense: DemoScenario;
  className?: string;
};

/**
 * A CSS-only laptop showing a mini MoneyApp group screen: the group ledger on
 * the left and an Add Expense panel whose labels and split rules mirror
 * `create-expense-modal.tsx`. Drawn at 720×466 and scaled by the parent.
 */
export function LaptopMock({ rows, expense, className }: LaptopMockProps) {
  const { play } = useLandingSound();
  const [selected, setSelected] = useState<string[]>(() =>
    DEMO_MEMBERS.map((m) => m.userId),
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');

  const toggleMember = (userId: string) => {
    play('tap');
    setSelected((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const chooseMode = (mode: SplitMode) => {
    if (mode === splitMode) return;
    play('tap');
    setSplitMode(mode);
  };

  const selectedMembers = DEMO_MEMBERS.filter((m) =>
    selected.includes(m.userId),
  );
  const shares = equalShares(expense.total, selectedMembers.length);
  const preset = useMemo(() => customPreset(expense.total), [expense.total]);
  const custom = customValidity(
    expense.total,
    Object.fromEntries(
      selectedMembers.map((m) => [m.userId, preset[m.userId] ?? 0]),
    ),
  );
  const ledgerTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className={cn('relative w-[720px]', className)}>
      {/* Lid */}
      <div className="relative h-[450px] rounded-[22px] border border-white/10 bg-[#141414] p-[10px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]">
        <span
          aria-hidden
          className="absolute left-1/2 top-[4px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/25"
        />
        <div className="flex h-full flex-col overflow-hidden rounded-[14px] bg-[#050505] text-foreground">
          {/* App bar */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-4">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_#00ff41]" />
              Money<span className="-ml-1.5 text-accent">App</span>
            </span>
            <span className="text-[12px] font-semibold tracking-[-0.02em]">
              Barkada · BGC
            </span>
            <span className="flex -space-x-1.5" aria-hidden>
              {DEMO_MEMBERS.map((m) => (
                <span
                  key={m.userId}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-[#050505] bg-[#1c1c1c] text-[9px] font-semibold text-muted"
                >
                  {memberName(m.userId, m.name).charAt(0)}
                </span>
              ))}
            </span>
          </div>

          <div className="flex min-h-0 flex-1 gap-3 p-3">
            {/* Sidebar rail: first to disappear when the laptop bleeds off
                the left edge, so the ledger stays fully visible. */}
            <div
              aria-hidden
              className="-my-3 -ml-3 flex w-10 shrink-0 flex-col items-center gap-2.5 border-r border-border py-3"
            >
              <span className="h-5 w-5 rounded-md border border-accent/40 bg-accent/15" />
              <span className="h-5 w-5 rounded-md bg-white/[0.06]" />
              <span className="h-5 w-5 rounded-md bg-white/[0.06]" />
              <span className="h-5 w-5 rounded-md bg-white/[0.06]" />
            </div>

            {/* Group ledger */}
            <section
              aria-label="Group ledger"
              className="flex w-[250px] shrink-0 flex-col"
            >
              <div className="flex items-baseline justify-between px-1 pb-2">
                <h3 className="text-[12px] font-semibold">Expenses</h3>
                <span className="font-mono text-[10px] tabular-nums text-muted">
                  {formatPeso(ledgerTotal)}
                </span>
              </div>
              <ul className="flex h-[300px] flex-col gap-1.5 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {rows.map((row, i) => (
                    <motion.li
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: -14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={SPRING}
                      className="flex h-[54px] shrink-0 items-center justify-between gap-3 rounded-xl border border-border bg-[#0a0a0a] px-3"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[12px] font-medium">
                          <span className="truncate">{row.name}</span>
                          {i === 0 && row.isNew && (
                            <MiniBadge className="border-accent/40 text-accent">
                              New
                            </MiniBadge>
                          )}
                        </span>
                        <span className="block font-mono text-[10px] text-muted">
                          Paid by {row.payer}
                        </span>
                      </span>
                      <span className="font-mono text-[12px] tabular-nums">
                        {formatPeso(row.total)}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>

            {/* Add Expense panel */}
            <section
              aria-label="Add Expense"
              className="relative flex min-w-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-[#0a0a0a] p-3.5"
            >
              <h3 className="text-[13px] font-semibold">Add Expense</h3>
              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
                <Field label="Expense Name *">{expense.name}</Field>
                <Field label="Amount (₱) *" mono>
                  {expense.total.toFixed(2)}
                </Field>
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-muted">
                  <UserPlus aria-hidden className="h-3 w-3" /> Split with
                  Members
                </p>
                <div
                  role="group"
                  aria-label="Split with Members"
                  className="flex flex-wrap gap-1.5"
                >
                  {DEMO_MEMBERS.map((m) => {
                    const on = selected.includes(m.userId);
                    return (
                      <motion.button
                        key={m.userId}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleMember(m.userId)}
                        whileTap={{ scale: 0.88 }}
                        transition={SPRING}
                        className={cn(
                          'h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                          on
                            ? 'border-accent bg-accent text-black'
                            : 'border-border text-muted hover:text-foreground',
                        )}
                      >
                        {memberName(m.userId, m.name)}
                        {isCurrentUser(m.userId) && ' (You)'}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-medium text-muted">
                  Split Type
                </p>
                <div
                  role="group"
                  aria-label="Split Type"
                  className="grid grid-cols-2 rounded-full border border-border p-0.5"
                >
                  {(['equal', 'custom'] as const).map((mode) => {
                    const on = splitMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={on}
                        onClick={() => chooseMode(mode)}
                        className="relative h-6 rounded-full text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      >
                        {on && (
                          <motion.span
                            layoutId="hero-split-type"
                            transition={SPRING}
                            className="absolute inset-0 rounded-full border border-white/10 bg-white/10"
                          />
                        )}
                        <span
                          className={cn(
                            'relative',
                            on ? 'text-foreground' : 'text-muted',
                          )}
                        >
                          {mode === 'equal'
                            ? 'Divide Equally'
                            : 'Custom Amounts'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0">
                <p className="mb-1.5 text-[10px] font-medium text-muted">
                  Split Preview
                </p>
                {selectedMembers.length === 0 ? (
                  <p className="text-[11px] text-[#ff6b6b]">
                    Select at least one member
                  </p>
                ) : (
                  <>
                    <ul className="space-y-1">
                      {selectedMembers.map((m, i) => {
                        const me = isCurrentUser(m.userId);
                        const value =
                          splitMode === 'equal'
                            ? (shares[i] ?? 0)
                            : (preset[m.userId] ?? 0);
                        const excluded = splitMode === 'custom' && value <= 0;
                        return (
                          <li
                            key={m.userId}
                            className={cn(
                              'flex h-[26px] items-center justify-between rounded-lg border border-border px-2.5 text-[11px]',
                              excluded && 'opacity-60',
                            )}
                          >
                            <span
                              className={cn(
                                'flex items-center gap-1.5',
                                me && 'font-medium text-accent',
                              )}
                            >
                              {memberName(m.userId, m.name)}
                              {me && (
                                <MiniBadge className="border-accent text-accent">
                                  Paid
                                </MiniBadge>
                              )}
                              {excluded && (
                                <MiniBadge className="border-border text-muted">
                                  Excluded
                                </MiniBadge>
                              )}
                            </span>
                            <span
                              className={cn(
                                'font-mono tabular-nums',
                                splitMode === 'equal'
                                  ? 'text-accent'
                                  : 'rounded-md border border-border px-1.5 text-foreground',
                              )}
                            >
                              {formatPeso(value)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    {splitMode === 'custom' && (
                      <div className="mt-1.5 space-y-0.5 font-mono text-[10px] tabular-nums">
                        <p
                          className={
                            custom.isValid ? 'text-muted' : 'text-[#ff6b6b]'
                          }
                        >
                          Total assigned: {formatPeso(custom.assigned)} /{' '}
                          {formatPeso(expense.total)}
                          {!custom.isValid && ' — amounts must match'}
                        </p>
                        {custom.excludedCount > 0 && (
                          <p className="text-muted">
                            {custom.excludedCount} member
                            {custom.excludedCount > 1 ? 's' : ''} excluded (zero
                            amount)
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Beside the chip row, above the (label-only) right side of
                  the Split Type row, so it never covers a control. */}
              <HandNote
                direction="up-left"
                className="absolute right-3 top-[100px] hidden sm:flex [&>span]:text-xl"
              >
                pick who&apos;s in
              </HandNote>
            </section>
          </div>
        </div>
      </div>

      {/* Base */}
      <div
        aria-hidden
        className="relative -mx-6 h-4 rounded-b-2xl bg-gradient-to-b from-[#2b2b2b] to-[#0f0f0f]"
      >
        <span className="absolute left-1/2 top-0 h-1.5 w-24 -translate-x-1/2 rounded-b-md bg-black/60" />
      </div>
    </div>
  );
}
