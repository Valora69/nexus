import Link from 'next/link';

import { buttonClasses } from '@web/components/ui/button';
import { BrandLogo } from '@web/components/ui/brand-logo';
import { ScrollFloat } from '@web/components/effects/ScrollFloat';
import { cn } from '@web/lib/utils';

export default function LandingPage() {
  return (
    <div className="aurora-bg relative flex min-h-screen flex-col overflow-hidden">
      <Orbs />

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
          <Link
            href="/login"
            className={buttonClasses({ variant: 'ghost', size: 'sm' })}
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

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Hero />
        <ProblemPanel />
        <Features />
        <HowItWorks />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Orbs() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-accent-2/15 blur-3xl"
      />
    </>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 text-base font-medium tracking-tight',
        className,
      )}
    >
      <BrandLogo />
      Money<span className="text-accent">App</span>
    </Link>
  );
}

/* ---------- Sections ---------- */

const SECTION_HEADLINE =
  'block text-3xl font-light leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl';

function Hero() {
  return (
    <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-24">
      <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
        Shared and missing expenses? We got you.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
        Track who paid for what, split fairly, and settle up in seconds.
        Designed for people who share money, not spreadsheets.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className={buttonClasses({ variant: 'primary', size: 'lg' })}
        >
          Get Started
        </Link>
        <a
          href="#features"
          className={buttonClasses({ variant: 'secondary', size: 'lg' })}
        >
          See Features
        </a>
      </div>
    </section>
  );
}

function ProblemPanel() {
  return (
    <section className="py-32 sm:py-40">
      <div className="mx-auto max-w-3xl rounded-4xl border border-border bg-card p-8 text-center backdrop-blur-xl sm:p-14">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          The Problem
        </p>
        <ScrollFloat
          containerClassName="mt-4"
          textClassName={SECTION_HEADLINE}
          stagger={0.025}
        >
          You shouldn&apos;t need a spreadsheet to split a pizza.
        </ScrollFloat>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
          Group expenses are a quiet kind of friction. Someone fronts the bill,
          others promise to pay later, and a week later nobody quite remembers
          who owed what. Money App keeps the math automatic and the receipts
          honest — so the friend chat stays a friend chat.
        </p>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Build for daily use',
    desc: 'From morning coffee to monthly rent, track shared expenses as they happen — not a week later when nobody remembers.',
  },
  {
    title: 'Quick Add expenses',
    desc: 'Just press B from anywhere in the app. Add an expense in a single sentence!',
  },
  {
    title: 'Groups that make sense',
    desc: 'Friends, trips, lunch — every shared cost lives in the right place, with the right people.',
  },
  {
    title: 'Fair splits, every time',
    desc: 'Equal, percentage, or custom shares — math is calculated to the cent so nobody silently overpays.',
  },
  {
    title: 'Settle up in one tap',
    desc: 'Net balances per friend or per group. Mark a transfer as paid and the books reconcile instantly.',
  },
  {
    title: 'Gentle confirmations',
    desc: 'Payments wait on confirmation from both sides. Nothing gets missed and no awkward follow-up messages.',
  },
];

function Features() {
  return (
    <section id="features" className="py-32 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Built tracking not just expenses, but the whole shared money
          experience.
        </h2>
      </div>
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="glass-card hover-lift p-6 hover:border-border-strong"
          >
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
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
    <section id="how-it-works" className="py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            How it works
          </p>
          <ScrollFloat
            containerClassName="mt-4"
            textClassName={SECTION_HEADLINE}
            stagger={0.025}
          >
            Four steps. No tutorial required.
          </ScrollFloat>
        </div>
        <ol className="mt-16 space-y-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="glass-card flex items-start gap-5 p-5 sm:p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-medium text-background shadow-glow">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-normal tracking-tight">
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
    <section className="pb-32 pt-32 sm:pb-40 sm:pt-40">
      <div className="mx-auto max-w-2xl text-center">
        <ScrollFloat
          textClassName={SECTION_HEADLINE}
          stagger={0.025}
        >
          Ready to make &ldquo;who owes who&rdquo; a one-second answer?
        </ScrollFloat>
        <p className="mt-6 text-base text-muted">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          No more guessing where money goes.
        </h2>
        <p className="mt-4 text-base text-muted">
          Free, forever. Sign in once and you&apos;re set.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/login"
            className={buttonClasses({ variant: 'primary', size: 'lg' })}
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
        <BrandMark className="text-sm" />
        <div className="flex items-center gap-6 text-xs text-muted">
          <a href="/terms" className="transition hover:text-foreground">
            Terms
          </a>
          <a href="/privacy" className="transition hover:text-foreground">
            Privacy
          </a>
          <span>© {new Date().getFullYear()} Money App</span>
        </div>
      </div>
    </footer>
  );
}
