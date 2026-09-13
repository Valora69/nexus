import Link from 'next/link';

import { buttonClasses } from '@web/components/ui/button';

import { BrandMark } from './brand-mark';
import { CircuitGrid } from './circuit-grid';

/**
 * The last stop: "Split it. Settle it. Stay friends." in giant type over the
 * converging circuit traces. In track mode it's also the footer (brand,
 * Terms, Privacy, ©) and the page hides LandingFooter; in vertical mode the
 * normal footer follows, so the links stay out of here.
 */
export function Finale() {
  return (
    <>
      {/* Unpositioned section: the grid fills the whole panel. */}
      <CircuitGrid variant="converge" />
      <section
        id="get-started"
        aria-labelledby="finale-heading"
        className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 group-data-[mode=track]/shell:max-w-none group-data-[mode=track]/shell:flex-row group-data-[mode=track]/shell:items-end group-data-[mode=track]/shell:justify-between group-data-[mode=track]/shell:px-[max(4rem,6vw)]"
      >
        <div>
          {/* The trailing space keeps the accessible name a sentence. */}
          <h2
            id="finale-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(3.25rem,7vw,7.5rem)] font-extrabold leading-[0.9] tracking-[-0.05em]"
          >
            {/* One phrase per line on phones, so "it." never wraps alone. */}
            <span className="block">
              <span className="block sm:inline">Split it. </span>
              <span className="block sm:inline">Settle it. </span>
            </span>
            <span className="block text-accent">Stay friends.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/login"
              className={buttonClasses({
                variant: 'primary',
                size: 'lg',
                className: '!shadow-none',
              })}
            >
              Get Started
            </Link>
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
              Free · Web + iOS
            </span>
          </div>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-4 pb-2 group-data-[mode=track]/shell:flex">
          <BrandMark className="text-sm" />
          <nav
            aria-label="Legal"
            className="flex items-center gap-6 text-xs text-muted"
          >
            <a href="/terms" className="transition hover:text-foreground">
              Terms
            </a>
            <a href="/privacy" className="transition hover:text-foreground">
              Privacy
            </a>
          </nav>
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Money App
          </p>
        </div>
      </section>
    </>
  );
}
