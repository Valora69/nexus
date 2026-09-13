import type { SplitStatus } from '@web/lib/utils/splits';
import { formatPeso } from '@web/lib/landing/demo';
import { cn } from '@web/lib/utils';

export type ExpenseCardRow = {
  name: string;
  share: number;
  status?: SplitStatus;
  isPayer?: boolean;
  excluded?: boolean;
};

type ExpenseCardProps = {
  name: string;
  total: number;
  payerName: string;
  rows: ExpenseCardRow[];
  /** Name of the row to emphasize (e.g. the person the current step is about). */
  highlight?: string;
  className?: string;
};

const STATUS_STYLES: Record<SplitStatus, string> = {
  unpaid: 'border-border text-muted',
  partial: 'border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]',
  pending: 'border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]',
  paid: 'border-accent/30 bg-accent/10 text-accent',
};

const STATUS_LABELS: Record<SplitStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  pending: 'Pending',
  paid: 'Paid',
};

function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-200',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ExpenseCard({
  name,
  total,
  payerName,
  rows,
  highlight,
  className,
}: ExpenseCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-[#0a0a0a] p-5 text-foreground',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Expense
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em]">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Paid by {payerName} · {rows.length}{' '}
            {rows.length === 1 ? 'person' : 'people'}
          </p>
        </div>
        <p className="font-mono text-xl font-semibold tabular-nums">
          {formatPeso(total)}
        </p>
      </div>

      <ul className="mt-5 divide-y divide-border border-t border-border">
        {rows.map((row) => (
          <li
            key={row.name}
            className={cn(
              'flex items-center justify-between gap-3 py-2.5 transition-opacity duration-200',
              row.excluded && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'flex min-w-0 items-center gap-2 text-sm',
                highlight === row.name && 'font-medium text-accent',
              )}
            >
              <span className="truncate">{row.name}</span>
              {row.isPayer && (
                <Badge className="border-accent/40 text-accent">Paid</Badge>
              )}
              {row.excluded && <Badge className="text-muted">Excluded</Badge>}
              {!row.isPayer && !row.excluded && row.status && (
                <Badge className={STATUS_STYLES[row.status]}>
                  {STATUS_LABELS[row.status]}
                </Badge>
              )}
            </span>
            <span className="font-mono text-sm tabular-nums text-muted">
              {formatPeso(row.excluded ? 0 : row.share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
