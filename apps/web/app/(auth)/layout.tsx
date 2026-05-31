import Link from 'next/link';

import { PlasmaBackdrop } from '@web/components/auth/auth-background';
import { BrandLogo } from '@web/components/ui/brand-logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background">
      <PlasmaBackdrop />
      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        <MarketingPanel />
        <main className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 flex items-center gap-2 text-base font-bold tracking-tight lg:hidden"
            >
              <BrandLogo />
              Money<span className="text-accent">App</span>
            </Link>
            <div className="glass-card-elevated p-8 sm:p-10">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

const CHIPS = [
  { icon: '👥', label: 'Groups & friends' },
  { icon: '⚡', label: 'Quick-capture' },
  { icon: '🧮', label: 'Fair splits' },
  { icon: '💸', label: 'One-tap settle' },
];

function MarketingPanel() {
  return (
    <aside className="relative hidden flex-col justify-between p-10 lg:flex xl:p-14">
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-bold tracking-tight"
      >
        <BrandLogo />
        Money<span className="text-accent">App</span>
      </Link>

      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          We got you covered
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight xl:text-5xl">
          Split anything.{' '}
          <span className="text-gradient">Settle anywhere.</span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted">
          A calm, deliberate place to track shared expenses with people you
          actually know. No spreadsheets. No awkward follow-ups.
        </p>
        {/* <div className="mt-7 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm backdrop-blur-xl"
            >
              <span aria-hidden>{chip.icon}</span>
              <span className="font-medium">{chip.label}</span>
            </span>
          ))}
        </div> */}
      </div>

      <p className="text-xs text-muted">
        © {new Date().getFullYear()} Money App. Free, forever.
      </p>
    </aside>
  );
}
