import Link from 'next/link';

import { buttonClasses } from '@web/components/ui/button';

import { BrandMark } from './brand-mark';
import { SoundPill } from './sound-pill';

export function LandingHeader() {
  return (
    <header className="relative z-10 mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between rounded-full border border-border bg-card px-5 py-3 backdrop-blur-xl">
      <BrandMark />
      <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
        <a href="#features" className="transition hover:text-foreground">
          Features
        </a>
        <a href="#how-it-works" className="transition hover:text-foreground">
          How it works
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <SoundPill />
        {/* Hidden on phones to make room for the Sound pill; Get Started
            goes to the same /login page. */}
        <Link
          href="/login"
          className={buttonClasses({
            variant: 'ghost',
            size: 'sm',
            className: 'hidden sm:inline-flex',
          })}
        >
          Sign In
        </Link>
        <Link
          href="/login"
          className={buttonClasses({ variant: 'primary', size: 'sm' })}
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
