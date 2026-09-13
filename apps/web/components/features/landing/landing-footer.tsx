import { BrandMark } from './brand-mark';

export function LandingFooter() {
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
