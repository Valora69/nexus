'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { cn } from '@web/lib/utils';

/**
 * One header per page: the sticky top bar owns the title, and pages fill it
 * by rendering <PageHeader>, which portals into slots the layout exposes.
 * Portals keep the page's own handlers/context, so actions like
 * "Create Group" work exactly as if they were rendered inline.
 */

type SlotName = 'title' | 'actions' | 'mobileTitle' | 'mobileActions';

interface PageHeaderContextValue {
  targets: Partial<Record<SlotName, HTMLElement>>;
  setTarget: (name: SlotName, el: HTMLElement | null) => void;
  claimed: boolean;
  claim: () => () => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<
    Partial<Record<SlotName, HTMLElement>>
  >({});
  const [claims, setClaims] = useState(0);

  const setTarget = useCallback((name: SlotName, el: HTMLElement | null) => {
    setTargets((prev) => {
      if ((prev[name] ?? null) === el) return prev;
      const next = { ...prev };
      if (el) next[name] = el;
      else delete next[name];
      return next;
    });
  }, []);

  const claim = useCallback(() => {
    setClaims((c) => c + 1);
    return () => setClaims((c) => c - 1);
  }, []);

  const value = useMemo(
    () => ({ targets, setTarget, claimed: claims > 0, claim }),
    [targets, setTarget, claims, claim],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

interface PageHeaderSlotProps {
  name: SlotName;
  /** Rendered until a page mounts a <PageHeader>. */
  fallback?: ReactNode;
  className?: string;
}

/** Layout side: a mount point that pages portal their header into. */
export function PageHeaderSlot({
  name,
  fallback,
  className = 'contents',
}: PageHeaderSlotProps) {
  const ctx = useContext(PageHeaderContext);
  const setTarget = ctx?.setTarget;
  const ref = useCallback(
    (el: HTMLDivElement | null) => setTarget?.(name, el),
    [setTarget, name],
  );

  return (
    <>
      {!ctx?.claimed && fallback}
      <div ref={ref} className={className} />
    </>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /** Shows a back arrow before the title. */
  backHref?: string;
  /** Page-level actions, e.g. a "Create Group" button. */
  actions?: ReactNode;
}

/** Page side: declares the page's title, subtitle, back link and actions. */
export function PageHeader({
  title,
  subtitle,
  backHref,
  actions,
}: PageHeaderProps) {
  const ctx = useContext(PageHeaderContext);
  const claim = ctx?.claim;

  useEffect(() => claim?.(), [claim]);

  if (!ctx) return null;
  const { targets } = ctx;

  const backLink = (size: 'sm' | 'md') =>
    backHref ? (
      <Link
        href={backHref}
        aria-label="Back"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-card hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          size === 'md' ? 'h-9 w-9' : 'h-8 w-8',
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
    ) : null;

  return (
    <>
      {targets.title &&
        createPortal(
          <div className="flex min-w-0 items-center gap-2">
            {backLink('md')}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-light leading-tight tracking-wide text-foreground">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted">{subtitle}</p>
              ) : null}
            </div>
          </div>,
          targets.title,
        )}
      {targets.actions && actions
        ? createPortal(actions, targets.actions)
        : null}
      {targets.mobileTitle &&
        createPortal(
          <div className="flex min-w-0 items-center gap-1">
            {backLink('sm')}
            <span className="truncate text-sm font-semibold tracking-tight">
              {title}
            </span>
          </div>,
          targets.mobileTitle,
        )}
      {targets.mobileActions && actions
        ? createPortal(actions, targets.mobileActions)
        : null}
    </>
  );
}
