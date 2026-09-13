import Link from 'next/link';

// Import modules directly rather than via the barrel: the barrel re-exports
// client toys (e.g. HandNote → motion) that would otherwise ship on this route.
import { Bento } from '@web/components/features/landing/bento';
import { DemoActivityProvider } from '@web/components/features/landing/demo-activity-provider';
import { landingFontVariables } from '@web/components/features/landing/fonts';
import { Hero } from '@web/components/features/landing/hero';
import { LandingFooter } from '@web/components/features/landing/landing-footer';
import { LandingHeader } from '@web/components/features/landing/landing-header';
import { LandingShell } from '@web/components/features/landing/landing-shell';
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
              // Placeholders until their track panels land in later stages.
              {
                key: 'how-it-works',
                label: 'How it works',
                content: <HowItWorks />,
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

const STEPS = [
  {
    title: 'Sign in with Google',
    desc: 'One tap. No password to forget, no email to verify.',
  },
  {
    title: 'Log expenses as they happen',
    desc: 'Quick-capture an expense from anywhere with the keyboard shortcut, or open a group and add it inline.',
  },
  {
    title: 'Add the people you share with',
    desc: 'Invite friends by email or share a link. They join with one click.',
  },
  {
    title: 'Settle up when it suits you',
    desc: 'Net balances tell you exactly what to send (or expect). Mark transfers as paid, both sides confirm, done.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps. No tutorial required.
          </h2>
        </div>
        <ol className="mt-10 space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="glass-card flex items-start gap-5 p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-background shadow-glow">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
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
