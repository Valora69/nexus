'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Bell } from 'lucide-react';

import { AppSidebar } from './AppSidebar';
import { QuickCaptureModal } from './QuickCaptureModal';
import {
  PageHeaderProvider,
  PageHeaderSlot,
} from '@web/components/layout/page-header';
import {
  QuickAddButton,
  QuickAddIconButton,
  QUICK_ADD_KEY,
  QUICK_ADD_LEGACY_KEY,
} from '@web/components/layout/quick-add-button';
import { ThemeToggle } from '@web/components/ui/theme-toggle';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { useGetGroupById } from '@web/lib/client/queries/groupQueries';
import { queryClient } from '@web/lib/client/tanstack-query';
import { cn } from '@web/lib/utils';
import { BrandLogo } from '@web/components/ui/brand-logo';

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Dashboard',
  '/groups': 'Groups',
  '/expenses': 'Expenses',
  '/payments': 'Payments',
  '/profile': 'Account',
  '/friends': 'Friends',
};

function resolvePageTitle(pathname: string): string {
  if (!pathname) return 'Dashboard';
  for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return title;
  }
  return 'Dashboard';
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const [captureOpen, setCaptureOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groupRouteMatch = pathname.match(/^\/groups\/([^/]+)/);
  const currentGroupId =
    groupRouteMatch && groupRouteMatch[1] !== undefined
      ? groupRouteMatch[1]
      : undefined;
  // Already cached by the group page; drives the contextual "Add to …" label.
  const { data: currentGroup } = useGetGroupById(currentGroupId ?? '');
  const quickAddLabel = currentGroup?.name
    ? `Add to ${currentGroup.name}`
    : 'Quick add';

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement | null)?.isContentEditable === true;

      const key = e.key.toLowerCase();
      if (
        !isEditable &&
        (key === QUICK_ADD_KEY || key === QUICK_ADD_LEGACY_KEY) &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setCaptureOpen(true);
      }

      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      // Always wipe cache so prior user's data doesn't leak to the next session.
      queryClient.clear();
      router.push('/login');
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  const pageTitle = resolvePageTitle(pathname);

  return (
    <PageHeaderProvider>
      <div className="relative min-h-screen">
        <QuickCaptureModal
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
          groupId={currentGroupId}
        />

        {/* Desktop floating sidebar */}
        <div className="fixed bottom-3 left-3 top-3 z-30 hidden w-64 md:block">
          <AppSidebar user={currentUser ?? undefined} onLogout={handleLogout} />
        </div>

        {/* Mobile header */}
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-overlay px-4 backdrop-blur-xl md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/home" aria-label="Money App home" className="shrink-0">
              <BrandLogo />
            </Link>
            <PageHeaderSlot
              name="mobileTitle"
              fallback={
                <span className="truncate text-sm font-semibold tracking-tight">
                  {pageTitle}
                </span>
              }
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <QuickAddIconButton
              label={quickAddLabel}
              onClick={() => setCaptureOpen(true)}
            />
            <button
              type="button"
              aria-label="Notifications"
              className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:border-border-strong"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile drawer */}
        <div
          className={cn(
            'fixed inset-0 z-50 md:hidden',
            drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          aria-hidden={!drawerOpen}
        >
          <div
            className={cn(
              'absolute inset-0 bg-scrim backdrop-blur-sm transition-opacity duration-200',
              drawerOpen ? 'opacity-100' : 'opacity-0',
            )}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={cn(
              'absolute bottom-3 left-3 top-3 w-72 transition-transform duration-300 ease-out',
              drawerOpen ? 'translate-x-0' : '-translate-x-[110%]',
            )}
          >
            <div className="relative h-full">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-card hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <AppSidebar
                user={currentUser ?? undefined}
                onLogout={handleLogout}
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
          </div>
        </div>

        {/* Main column */}
        <div className="flex min-h-screen flex-col pt-16 md:pl-[17.5rem] md:pt-0">
          {/* Desktop sticky topbar */}
          <div className="sticky top-0 z-20 hidden px-6 pt-4 md:block">
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card px-5 py-3 shadow-glass backdrop-blur-2xl">
              <div className="flex min-w-0 items-center gap-3">
                <PageHeaderSlot
                  name="title"
                  fallback={
                    <h1 className="truncate text-lg font-light tracking-wide text-foreground">
                      {pageTitle}
                    </h1>
                  }
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PageHeaderSlot
                  name="actions"
                  className="flex items-center gap-2 empty:hidden"
                />
                <QuickAddButton
                  label={quickAddLabel}
                  onClick={() => setCaptureOpen(true)}
                />
                <button
                  type="button"
                  aria-label="Notifications"
                  className="glass inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-7xl animate-fade-in">
              {/* Page actions (e.g. Create Group) on mobile, where the top bar is hidden */}
              <PageHeaderSlot
                name="mobileActions"
                className="flex justify-end gap-2 px-6 pt-6 empty:hidden md:hidden"
              />
              {children}
            </div>
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
