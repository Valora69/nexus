import { cn } from '@web/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-card backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[rgb(255_255_255_/_0.06)] to-transparent"
      />
    </div>
  );
}

export { Skeleton };
