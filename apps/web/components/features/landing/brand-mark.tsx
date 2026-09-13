import Link from 'next/link';

import { BrandLogo } from '@web/components/ui/brand-logo';
import { cn } from '@web/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-base font-bold tracking-tight',
        className,
      )}
    >
      <BrandLogo />
      Money<span className="text-accent">App</span>
    </Link>
  );
}
