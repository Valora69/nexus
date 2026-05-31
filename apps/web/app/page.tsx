import Link from 'next/link';

import { buttonClasses } from '@web/components/ui/button';
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
        'flex items-center gap-2 text-base font-bold tracking-tight',
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17L17 7M17 7H8M17 7v9" />
        </svg>
      </span>
      Money<span className="text-accent">App</span>
    </Link>
  );
}

function Hero() {
  return (
    <section className="mx-auto mt-16 max-w-3xl text-center sm:mt-24">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted backdrop-blur-xl">
        <span className="font-semibold text-accent">100% free</span>
        <span className="text-border-strong">|</span>
        <span>No credit card required</span>
      </span>
      <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
        Shared expenses, <span className="text-gradient">untangled.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
        Track who paid for what, split fairly, and settle up in seconds.
        Designed for the bills you actually share — trips, roommates, group
        dinners.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className={buttonClasses({ variant: 'primary', size: 'lg' })}
        >
          Get Started — Free
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
    <section className="mt-24">
      <div className="mx-auto max-w-3xl rounded-4xl border border-border bg-card p-8 text-center backdrop-blur-xl sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          The Problem
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          You shouldn't need a spreadsheet to split a pizza.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted">
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
    icon: '👥',
    title: 'Groups that make sense',
    desc: 'Roommates, trips, weekly poker — every shared cost lives in the right place, with the right people.',
  },
  {
    icon: '⚡',
    title: 'Quick-capture expenses',
    desc: 'Hit B from anywhere in the app. Capture an expense in a single sentence and split it however you like.',
  },
  {
    icon: '🧮',
    title: 'Fair splits, every time',
    desc: 'Equal, percentage, or custom shares — math is calculated to the cent so nobody silently overpays.',
  },
  {
    icon: '💸',
    title: 'Settle up in one tap',
    desc: 'Net balances per friend or per group. Mark a transfer as paid and the books reconcile instantly.',
  },
  {
    icon: '🔔',
    title: 'Gentle confirmations',
    desc: 'Payments wait on confirmation from both sides. No phantom IOUs, no awkward follow-up messages.',
  },
  {
    icon: '🌗',
    title: 'Tactile-glass interface',
    desc: 'Light or dark, the surface is calm, fast, and easy on the eyes — built for daily glances, not dashboards.',
  },
];

function Features() {
  return (
    <section id="features" className="mt-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the way friends actually share money.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="glass-card hover-lift p-6 hover:border-border-strong"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-accent/10 text-2xl">
              {f.icon}
            </div>
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
    title: 'Add the people you share with',
    desc: 'Invite friends by email or share a link. They join with one click — same Google sign-in, no extra accounts.',
  },
  {
    title: 'Log expenses as they happen',
    desc: 'Quick-capture an expense from anywhere with the keyboard shortcut, or open a group and add it inline.',
  },
  {
    title: 'Settle up when it suits you',
    desc: 'Net balances tell you exactly what to send (or expect). Mark transfers as paid, both sides confirm, done.',
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="mt-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps. No tutorial required.
          </h2>
        </div>
        <ol className="mt-10 space-y-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="glass-card flex items-start gap-5 p-5 sm:p-6"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-lg font-bold text-white shadow-glow">
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
    <section className="mb-20 mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to make &ldquo;who owes who&rdquo; a one-second answer?
        </h2>
        <p className="mt-4 text-base text-muted">
          Free, forever. Sign in once and you&apos;re set.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className={buttonClasses({ variant: 'primary', size: 'lg' })}
          >
            Get Started — Free
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
