import { cn } from '@web/lib/utils';

/**
 * Brand mark — pulls the canonical logo from `apps/web/app/icon.svg`
 * (the same file Next.js uses as the favicon), so the tab icon and any
 * in-app logo always stay in lockstep.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.svg"
      alt=""
      aria-hidden
      width={28}
      height={28}
      className={cn('h-7 w-7 shrink-0 select-none', className)}
      draggable={false}
    />
  );
}

/**
 * Logo + "Money App" wordmark with the second word in brand green.
 */
export function BrandMark({
  className,
  logoClassName,
}: {
  className?: string;
  logoClassName?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-base font-bold tracking-tight',
        className,
      )}
    >
      <BrandLogo className={logoClassName} />
      <span>
        Money<span className="text-accent">App</span>
      </span>
    </span>
  );
}
