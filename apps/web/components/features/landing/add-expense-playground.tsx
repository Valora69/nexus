'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Delete, Receipt, UserPlus } from 'lucide-react';

import {
  DEMO_MEMBERS,
  KEYPAD_BACKSPACE,
  addExpenseConfirmation,
  applyKeypadKey,
  customValidity,
  equalShares,
  formatPeso,
} from '@web/lib/landing/demo';
import { DEMO_SCENARIOS } from '@web/lib/landing/simulated';
import { cn } from '@web/lib/utils';

import { useDemoActivity } from './demo-activity-provider';
import { HandNote } from './hand-note';
import { NotificationToast } from './notification-toast';
import { PesoFlow } from './peso-flow';
import { useLandingSound } from './sound-provider';

/** How long the receipt prints before it tears off and flies to the ledger. */
export const RECEIPT_PRINT_MS = 1100;
export const PLAYGROUND_TOAST_MS = 3200;
export const PLAYGROUND_MAX_ROWS = 4;

type SplitMode = 'equal' | 'custom';

type LedgerRow = {
  id: string;
  name: string;
  total: number;
  payer: string;
  isNew?: boolean;
};

type ReceiptLine = { userId: string; name: string; amount: number };

type PrintedReceipt = {
  id: string;
  name: string;
  total: number;
  lines: ReceiptLine[];
};

type Toast = { id: string; amount: number };

const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const SEED_ROWS: LedgerRow[] = [
  { id: 'seed-grab', name: 'Grab home', total: 240, payer: 'Mika' },
  { id: 'seed-milk-tea', name: 'Milk tea run', total: 390, payer: 'James' },
];

// A cash register's layout: 1–9 in rows, then 00, 0 and delete.
const KEYPAD: { key: string; label: string }[] = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0'].map((k) => ({
    key: k,
    label: k,
  })),
  { key: KEYPAD_BACKSPACE, label: 'Delete' },
];

const PAPER = '#f2efe6';

const CUSTOM_MISMATCH = 'Custom amounts must match the total';

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const className =
    'mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-muted';
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <p className={className}>{children}</p>
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-3xl border border-border bg-[#0a0a0a] p-5',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      transition={SPRING}
      className={cn(
        'h-8 rounded-full border px-3 text-[13px] font-medium tracking-[-0.02em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        on
          ? 'border-accent bg-accent text-black'
          : 'border-border text-muted hover:text-foreground',
      )}
    >
      {children}
    </motion.button>
  );
}

type KeycapProps = {
  keyValue: string;
  label: string;
  pressed: boolean;
  onPress: (key: string) => void;
};

function Keycap({ keyValue, label, pressed, onPress }: KeycapProps) {
  const isDelete = keyValue === KEYPAD_BACKSPACE;
  return (
    <button
      type="button"
      // The keypad group takes focus and typing; the caps stay out of the
      // tab order so Tab doesn't walk twelve keys.
      tabIndex={-1}
      aria-label={label}
      data-pressed={pressed}
      onClick={() => onPress(keyValue)}
      className={cn(
        'flex h-12 touch-manipulation select-none items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-[#242424] to-[#141414] font-mono text-lg font-semibold tabular-nums shadow-[0_4px_0_0_#000,0_6px_12px_-4px_rgb(0_0_0/0.9),inset_0_1px_0_rgb(255_255_255/0.08)] outline-none transition-[transform,box-shadow] duration-75',
        'active:translate-y-[2px] active:shadow-[0_2px_0_0_#000,inset_0_1px_0_rgb(255_255_255/0.08)] data-[pressed=true]:translate-y-[2px] data-[pressed=true]:shadow-[0_2px_0_0_#000,inset_0_1px_0_rgb(255_255_255/0.08)]',
        isDelete ? 'text-accent' : 'text-foreground',
      )}
    >
      {isDelete ? <Delete aria-hidden className="h-5 w-5" /> : label}
    </button>
  );
}

function ReceiptPaper({ receipt }: { receipt: PrintedReceipt }) {
  return (
    <div
      className="px-4 pb-1 pt-3 font-mono text-[11px] leading-relaxed text-[#151515]"
      style={{ backgroundColor: PAPER }}
    >
      <p className="text-center font-bold tracking-[0.2em]">MONEYAPP</p>
      <p className="text-center text-[10px] text-black/60">Barkada · BGC</p>
      <div className="my-2 border-t border-dashed border-black/30" />
      <p className="flex justify-between gap-3 font-bold">
        <span className="truncate">{receipt.name}</span>
        <span className="tabular-nums">{formatPeso(receipt.total)}</span>
      </p>
      <ul className="mt-1">
        {receipt.lines.map((line) => (
          <li key={line.userId} className="flex justify-between gap-3">
            <span className="text-black/70">{line.name}</span>
            <span className="tabular-nums">{formatPeso(line.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="my-2 border-t border-dashed border-black/30" />
      <p className="text-center text-[10px] text-black/60">Paid by You</p>
    </div>
  );
}

/**
 * "Add it before the bill hits the table.": a hands-on version of the
 * create-expense modal. Pick a scenario, tap the amount on a cash-register
 * keypad, choose who's in, and Add Expense prints a receipt that flies into
 * the group ledger.
 */
export function AddExpensePlayground() {
  const { play } = useLandingSound();
  const { expenseAdded } = useDemoActivity();

  const [name, setName] = useState<string>(DEMO_SCENARIOS[0].name);
  const [digits, setDigits] = useState('');
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(() =>
    DEMO_MEMBERS.map((m) => m.userId),
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<LedgerRow[]>(SEED_ROWS);
  const [printing, setPrinting] = useState<PrintedReceipt | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const nextId = useRef(0);
  const timers = useRef(new Set<number>());
  const nameId = useId();
  const keypadHintId = useId();
  const issueId = useId();

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => window.clearTimeout(t));
      pending.clear();
    };
  }, []);

  const later = (ms: number, run: () => void) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  };

  const amount = digits ? parseInt(digits, 10) : 0;
  const selectedMembers = DEMO_MEMBERS.filter((m) =>
    selected.includes(m.userId),
  );
  const shares = equalShares(amount, selectedMembers.length);
  const custom = customValidity(
    amount,
    Object.fromEntries(
      selectedMembers.map((m) => [m.userId, customSplits[m.userId] ?? '']),
    ),
  );
  const ledgerTotal = rows.reduce((sum, row) => sum + row.total, 0);

  // Same gate as the modal's canSubmit, plus "not mid-print".
  const trimmedName = name.trim();
  const issue = !trimmedName
    ? 'Add an expense name'
    : amount <= 0
      ? 'Tap an amount on the keypad'
      : selectedMembers.length === 0
        ? 'Select at least one member'
        : splitMode === 'custom' && !custom.isValid
          ? CUSTOM_MISMATCH
          : null;
  const canSubmit = issue === null && printing === null;

  const pressKey = (key: string) => {
    play('tap');
    setDigits((prev) => applyKeypadKey(prev, key));
  };

  // Typing works while focus is anywhere inside the keypad, never page-wide.
  const handleKeypadKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = /^\d$/.test(e.key)
      ? e.key
      : e.key === 'Backspace'
        ? KEYPAD_BACKSPACE
        : null;
    if (!key) return;
    e.preventDefault();
    setPressedKey(key);
    pressKey(key);
  };

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

  const submit = () => {
    if (!canSubmit) return;
    nextId.current += 1;
    const id = `playground-receipt-${nextId.current}`;
    const lines: ReceiptLine[] =
      splitMode === 'equal'
        ? selectedMembers.map((m, i) => ({
            userId: m.userId,
            name: m.name,
            amount: shares[i] ?? 0,
          }))
        : selectedMembers
            .filter((m) => custom.activeIds.includes(m.userId))
            .map((m) => ({
              userId: m.userId,
              name: m.name,
              amount: parseFloat(customSplits[m.userId] ?? '0'),
            }));
    const receipt: PrintedReceipt = {
      id,
      name: trimmedName,
      total: amount,
      lines,
    };

    play('register');
    setConfirmation(
      addExpenseConfirmation(amount, trimmedName, selectedMembers.length),
    );
    setPrinting(receipt);

    later(RECEIPT_PRINT_MS, () => {
      play('tear');
      // Unmounting the receipt while the row mounts with the same layoutId is
      // what flies the paper into the ledger.
      setPrinting(null);
      setRows((prev) =>
        [
          {
            id,
            name: receipt.name,
            total: receipt.total,
            payer: 'You',
            isNew: true,
          },
          ...prev.map((row) => ({ ...row, isNew: false })),
        ].slice(0, PLAYGROUND_MAX_ROWS),
      );
      setToasts((prev) => [...prev, { id, amount: receipt.total }].slice(-2));
      setAnnouncement(
        `Expense added: ${receipt.name} ${formatPeso(receipt.total)}`,
      );
      setDigits('');
      expenseAdded(receipt.total);
      later(PLAYGROUND_TOAST_MS, () =>
        setToasts((prev) => prev.filter((t) => t.id !== id)),
      );
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:gap-10 group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div className="max-w-md shrink-0 group-data-[mode=track]/shell:w-[20rem]">
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
            How it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            Add it before the bill hits the table.
          </h2>
          <p className="mt-5 text-base text-muted">
            Pick what it was, tap the amount, choose who&apos;s in. Everyone
            sees their share before the waiter comes back.
          </p>
          <HandNote
            direction="down-right"
            className="mt-6 hidden group-data-[mode=track]/shell:flex"
          >
            tap the keys
          </HandNote>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 group-data-[mode=track]/shell:grid-cols-[21rem_21rem_17rem] group-data-[mode=track]/shell:items-start">
          {/* Name + amount */}
          <Card>
            <div>
              <Label>Scenario</Label>
              <div
                role="group"
                aria-label="Scenario"
                className="flex flex-wrap gap-1.5"
              >
                {DEMO_SCENARIOS.map((scenario) => (
                  <Chip
                    key={scenario.name}
                    on={name === scenario.name}
                    onClick={() => {
                      play('tap');
                      setName(scenario.name);
                    }}
                  >
                    {scenario.name}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor={nameId}>Expense Name *</Label>
              <input
                id={nameId}
                value={name}
                maxLength={40}
                placeholder="e.g. Pizza night"
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-black px-3 text-[14px] outline-none placeholder:text-white/30 focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30"
              />
            </div>

            <div>
              <Label>Amount (₱) *</Label>
              <output
                aria-label="Amount"
                className="flex h-14 items-center justify-end rounded-xl border border-border bg-black px-4 text-[28px] font-semibold tracking-[-0.02em]"
              >
                <PesoFlow
                  value={amount}
                  className={amount > 0 ? 'text-foreground' : 'text-white/30'}
                />
              </output>
              <div
                role="group"
                aria-label="Amount keypad"
                aria-describedby={keypadHintId}
                tabIndex={0}
                onKeyDown={handleKeypadKeyDown}
                onKeyUp={() => setPressedKey(null)}
                onBlur={() => setPressedKey(null)}
                className="-mx-1 mt-3 grid grid-cols-3 gap-2 rounded-2xl p-1 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
              >
                {KEYPAD.map(({ key, label }) => (
                  <Keycap
                    key={key}
                    keyValue={key}
                    label={label}
                    pressed={pressedKey === key}
                    onPress={pressKey}
                  />
                ))}
              </div>
              <p id={keypadHintId} className="mt-1 text-[11px] text-muted">
                Tap the keys, or focus the keypad and type digits.
              </p>
            </div>
          </Card>

          {/* Split + submit */}
          <Card>
            <div>
              <Label>
                <UserPlus aria-hidden className="h-3.5 w-3.5" /> Split with
                Members
              </Label>
              <div
                role="group"
                aria-label="Split with Members"
                className="flex flex-wrap gap-1.5"
              >
                {DEMO_MEMBERS.map((m) => (
                  <Chip
                    key={m.userId}
                    on={selected.includes(m.userId)}
                    onClick={() => toggleMember(m.userId)}
                  >
                    {m.name}
                  </Chip>
                ))}
              </div>
              {selectedMembers.length === 0 && (
                <p className="mt-1.5 text-[12px] text-[#ff6b6b]">
                  Select at least one member
                </p>
              )}
            </div>

            <div>
              <Label>Split Type</Label>
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
                      className="relative h-8 rounded-full text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      {on && (
                        <motion.span
                          layoutId="playground-split-type"
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
                        {mode === 'equal' ? 'Divide Equally' : 'Custom Amounts'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <div>
                <Label>Split Preview</Label>
                <ul className="space-y-1.5">
                  {selectedMembers.map((m, i) => {
                    const raw = customSplits[m.userId] ?? '';
                    const excluded =
                      splitMode === 'custom' &&
                      !custom.activeIds.includes(m.userId);
                    return (
                      <li
                        key={m.userId}
                        className={cn(
                          'flex h-9 items-center justify-between gap-3 rounded-xl border border-border px-3 text-[13px]',
                          excluded && 'opacity-60',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          {m.name}
                          {excluded && (
                            <span className="rounded-full border border-border px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                              Excluded
                            </span>
                          )}
                        </span>
                        {splitMode === 'equal' ? (
                          <PesoFlow
                            value={shares[i] ?? 0}
                            className="text-accent"
                          />
                        ) : (
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            aria-label={`${m.name} amount`}
                            value={raw}
                            onChange={(e) =>
                              setCustomSplits((prev) => ({
                                ...prev,
                                [m.userId]: e.target.value,
                              }))
                            }
                            className="h-7 w-24 rounded-lg border border-border bg-black px-2 text-right font-mono text-[12px] tabular-nums outline-none focus-visible:border-accent/60"
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                {splitMode === 'custom' && (
                  <div className="mt-2 space-y-0.5 font-mono text-[11px] tabular-nums">
                    <p
                      className={
                        custom.isValid ? 'text-muted' : 'text-[#ff6b6b]'
                      }
                    >
                      Total assigned: {formatPeso(custom.assigned)} /{' '}
                      {formatPeso(amount)}
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
              </div>
            )}

            <div className="mt-auto">
              <p
                aria-live="polite"
                className="mb-3 min-h-[2.5rem] text-[13px] leading-snug text-foreground"
              >
                {confirmation}
              </p>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                aria-describedby={issue ? issueId : undefined}
                className="h-11 w-full rounded-full bg-accent text-[14px] font-semibold tracking-[-0.02em] text-black shadow-[0_3px_0_0_#00801f] outline-none transition-[transform,box-shadow,background-color] duration-75 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] enabled:active:translate-y-[2px] enabled:active:shadow-[0_1px_0_0_#00801f] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted disabled:shadow-none"
              >
                Add Expense
              </button>
              {issue && (
                <p
                  id={issueId}
                  // Member and custom-split problems already show the modal's
                  // message beside their controls; don't repeat it visibly.
                  className={cn(
                    'mt-2 text-[12px] text-muted',
                    (selectedMembers.length === 0 ||
                      issue === CUSTOM_MISMATCH) &&
                      'sr-only',
                  )}
                >
                  {issue}
                </p>
              )}
            </div>
          </Card>

          {/* Printer + ledger */}
          <div className="relative flex flex-col gap-4 md:col-span-2 lg:col-span-1">
            <div aria-hidden className="relative h-[240px]">
              <div className="relative z-10 mx-auto h-4 w-[92%] rounded-full border border-white/10 bg-gradient-to-b from-[#1b1b1b] to-black shadow-[inset_0_-2px_0_rgb(0_0_0/0.8)]">
                <span className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-black" />
              </div>
              <div className="mx-auto -mt-2 w-[80%]">
                {printing && (
                  <motion.div
                    key={printing.id}
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{
                      duration: (RECEIPT_PRINT_MS / 1000) * 0.7,
                      ease: EASE_OUT,
                    }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      layoutId={printing.id}
                      transition={SPRING}
                      className="shadow-[0_12px_24px_-12px_rgb(0_0_0/0.9)]"
                    >
                      <div className="h-2" style={{ backgroundColor: PAPER }} />
                      <ReceiptPaper receipt={printing} />
                      {/* Perforated tear-off edge. */}
                      <div
                        className="h-2"
                        style={{
                          backgroundImage: `radial-gradient(circle at 5px 8px, transparent 3.5px, ${PAPER} 4px)`,
                          backgroundSize: '10px 8px',
                        }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>

            <section
              aria-label="Group ledger"
              className="rounded-3xl border border-border bg-[#0a0a0a] p-4"
            >
              <div className="flex items-baseline justify-between px-1 pb-3">
                <h3 className="text-[13px] font-semibold">Barkada · BGC</h3>
                <PesoFlow
                  value={ledgerTotal}
                  className="text-[12px] text-muted"
                />
              </div>
              <ul className="flex h-[212px] flex-col gap-1.5 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {rows.map((row) => (
                    <motion.li
                      key={row.id}
                      layoutId={row.id}
                      layout
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={SPRING}
                      className="flex h-[50px] shrink-0 items-center justify-between gap-3 rounded-xl border border-border bg-black px-3"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium">
                          <span className="truncate">{row.name}</span>
                          {row.isNew && (
                            <span className="rounded-full border border-accent/40 px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-accent">
                              New
                            </span>
                          )}
                        </span>
                        <span className="block font-mono text-[11px] text-muted">
                          Paid by {row.payer}
                        </span>
                      </span>
                      <span className="font-mono text-[13px] tabular-nums">
                        {formatPeso(row.total)}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>

            {/* Toasts float over the printer once the receipt has left it. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-8 z-20 flex flex-col items-center gap-2"
            >
              <AnimatePresence initial={false}>
                {toasts.map((toast) => (
                  <motion.div
                    key={toast.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                  >
                    <NotificationToast
                      icon={<Receipt aria-hidden className="h-4 w-4" />}
                      title="Expense added"
                      amount={toast.amount}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <p className="sr-only" aria-live="polite">
              {announcement}
            </p>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
