import Link from 'next/link';

import PixelTrail from '@web/components/effects/PixelTrail';
import { buttonClasses } from '@web/components/ui/button';
import {
  DEMO_EXPENSE,
  DEMO_MEMBERS,
  demoSplitStatus,
  equalShares,
} from '@web/lib/landing/demo';

import { CircuitGrid } from './circuit-grid';
import { ExpenseCard, type ExpenseCardRow } from './expense-card';
import { HeroToasts } from './hero-toasts';

function memberName(userId: string): string {
  return DEMO_MEMBERS.find((m) => m.userId === userId)?.name ?? userId;
}

const shares = equalShares(
  DEMO_EXPENSE.total,
  DEMO_EXPENSE.participantIds.length,
);

const HERO_ROWS: ExpenseCardRow[] = DEMO_EXPENSE.participantIds.map(
  (userId, i) => {
    const share = shares[i] ?? 0;
    const isPayer = userId === DEMO_EXPENSE.payerId;
    return {
      name: memberName(userId),
      share,
      isPayer,
      status: isPayer ? undefined : demoSplitStatus('unpaid', share),
    };
  },
);

export function Hero() {
  return (
    // clip-path (not overflow) is what confines PixelTrail's position:fixed
    // canvas to this section while its pointer mapping stays viewport-based.
    <section className="relative [clip-path:inset(0)]">
      <PixelTrail
        gridSize={100}
        trailSize={0.05}
        maxAge={750}
        interpolate={0.5}
        color="#00ff41"
        gooeyFilter={{ id: 'custom-goo-filter', strength: 2 }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pb-28">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            Split it. Settle it. Stay friends.
          </h1>
          <p className="mt-6 max-w-md text-base text-muted sm:text-lg">
            Track who paid, split fairly, and settle up with proof. No
            spreadsheets, no awkward follow-ups.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className={buttonClasses({ variant: 'primary', size: 'lg' })}
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className={buttonClasses({ variant: 'secondary', size: 'lg' })}
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="relative mx-auto flex min-h-[500px] w-full max-w-md items-center justify-center lg:min-h-[520px] lg:max-w-none">
          <CircuitGrid />
          <ExpenseCard
            name={DEMO_EXPENSE.name}
            total={DEMO_EXPENSE.total}
            payerName={memberName(DEMO_EXPENSE.payerId)}
            rows={HERO_ROWS}
            className="relative z-10 w-full max-w-[20rem] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)] sm:max-w-sm"
          />
          <HeroToasts />
        </div>
      </div>
    </section>
  );
}
