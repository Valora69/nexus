import { formatPeso } from '@web/lib/landing/demo';
import { cn } from '@web/lib/utils';

type NotificationToastProps = {
  icon: React.ReactNode;
  title: string;
  amount?: number;
  className?: string;
};

/** Mirrors a real MoneyApp notification. The only glass surface on the page. */
export function NotificationToast({
  icon,
  title,
  amount,
  className,
}: NotificationToastProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-white/[0.04] py-2.5 pl-2.5 pr-4 text-foreground shadow-[0_12px_32px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl',
        className,
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        {amount !== undefined && (
          <span className="block font-mono text-xs tabular-nums text-muted">
            {formatPeso(amount)}
          </span>
        )}
      </span>
    </div>
  );
}
