import Link from 'next/link';

import PixelTrail from '@web/components/effects/PixelTrail';
import { buttonClasses } from '@web/components/ui/button';

import { CircuitGrid } from './circuit-grid';
import { HeroStage } from './hero-stage';

export function Hero() {
  return (
    // clip-path (not overflow) is what confines PixelTrail's position:fixed
    // canvas to this section while its pointer mapping stays viewport-based.
    // It also clips the laptop where it bleeds off the left edge.
    <section className="relative [clip-path:inset(0)]">
      <PixelTrail
        gridSize={100}
        trailSize={0.05}
        maxAge={750}
        interpolate={0.5}
        color="#00ff41"
        gooeyFilter={{ id: 'custom-goo-filter', strength: 2 }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-6 lg:pb-32 lg:pt-20">
        <div className="lg:order-2">
          {/* One phrase per line; the trailing spaces keep the accessible
              name reading as a sentence. */}
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,6vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            <span className="block">Split it. </span>
            <span className="block">Settle it. </span>
            <span className="block">Stay friends.</span>
          </h1>
          <p className="mt-6 max-w-md text-base text-muted sm:text-lg">
            Shared expenses for friends — add, split, and settle with proof.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/login"
              className={buttonClasses({ variant: 'primary', size: 'lg' })}
            >
              Get Started
            </Link>
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
              Free · Web + iOS
            </span>
          </div>
        </div>

        <div className="relative lg:order-1">
          <CircuitGrid className="-inset-10 sm:-inset-16" />
          <HeroStage />
        </div>
      </div>
    </section>
  );
}
