import Link from 'next/link';

// Import modules directly rather than via the barrel: the barrel re-exports
// client toys (e.g. HandNote → motion) that would otherwise ship on this route.
import { AddExpensePlayground } from '@web/components/features/landing/add-expense-playground';
import { Bento } from '@web/components/features/landing/bento';
import { BillSlicer } from '@web/components/features/landing/bill-slicer';
import { DemoActivityProvider } from '@web/components/features/landing/demo-activity-provider';
import { DemoGlobe } from '@web/components/features/landing/demo-globe';
import { landingFontVariables } from '@web/components/features/landing/fonts';
import { Hero } from '@web/components/features/landing/hero';
import { LandingFooter } from '@web/components/features/landing/landing-footer';
import { LandingHeader } from '@web/components/features/landing/landing-header';
import { LandingShell } from '@web/components/features/landing/landing-shell';
import { SettleSlingshot } from '@web/components/features/landing/settle-slingshot';
import { SoundProvider } from '@web/components/features/landing/sound-provider';
import { buttonClasses } from '@web/components/ui/button';

export default function LandingPage() {
  return (
    <SoundProvider>
      <DemoActivityProvider>
        {/* overflow-x-clip, not overflow-hidden: the latter would stop the
            track's sticky stage from sticking. */}
        <div
          className={`relative isolate flex min-h-screen flex-col overflow-x-clip bg-black ${landingFontVariables}`}
        >
          <LandingShell
            header={<LandingHeader />}
            panels={[
              {
                key: 'hero',
                label: 'Start',
                padded: false,
                content: <Hero />,
              },
              {
                key: 'features',
                label: 'Features',
                width: 'content',
                content: <Bento />,
              },
              {
                key: 'how-it-works',
                label: 'How it works',
                spaced: 'before',
                content: <AddExpensePlayground />,
              },
              {
                key: 'slice',
                label: 'Slice the bill',
                spaced: 'after',
                content: <BillSlicer />,
              },
              {
                key: 'settle',
                label: 'Settle up',
                content: <SettleSlingshot />,
              },
              {
                key: 'globe',
                label: 'Globe',
                content: <DemoGlobe />,
              },
              {
                key: 'get-started',
                label: 'Get started',
                content: <FinalCta />,
              },
            ]}
          >
            <LandingFooter />
          </LandingShell>
        </div>
      </DemoActivityProvider>
    </SoundProvider>
  );
}

function FinalCta() {
  return (
    <section className="px-4 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          No more guessing where money goes.
        </h2>
        <p className="mt-4 text-base text-muted">
          Free, forever. Sign in once and you&apos;re set.
        </p>
        <div className="mt-8 flex justify-center">
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
        </div>
      </div>
    </section>
  );
}
