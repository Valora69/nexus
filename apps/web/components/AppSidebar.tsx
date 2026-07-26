'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  DollarSign,
  CircleUser,
  LogOut,
} from 'lucide-react';

import { cn } from '@web/lib/utils';
import { BrandLogo } from '@web/components/ui/brand-logo';

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', url: '/home', icon: LayoutDashboard },
  { title: 'Groups', url: '/groups', icon: Users },
  { title: 'Expenses', url: '/expenses', icon: Receipt },
  { title: 'Payments', url: '/payments', icon: DollarSign },
  { title: 'Account', url: '/profile', icon: CircleUser },
];

export interface AppSidebarUser {
  name?: string;
  email?: string;
  picture?: string | null;
}

interface AppSidebarProps {
  user?: AppSidebarUser | null;
  onLogout?: () => void;
  onNavigate?: () => void;
  className?: string;
}

function getInitials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function AppSidebar({
  user,
  onLogout,
  onNavigate,
  className,
}: AppSidebarProps) {
  const pathname = usePathname() ?? '';

  return (
    <aside
      className={cn(
        'flex h-full w-full flex-col rounded-4xl border border-border bg-card shadow-glass backdrop-blur-2xl',
        className,
      )}
    >
      <div className="px-5 pt-5">
        <Link
          href="/home"
          onClick={onNavigate}
          className="flex items-center gap-2 text-base font-bold tracking-tight"
        >
          <BrandLogo />
          Money App
        </Link>
        {/* <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow" />
          Tactile Glass · Beta
        </span> */}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            const Icon = item.icon;
            return (
              <li key={item.url} className="relative">
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent shadow-glow"
                  />
                )}
                <Link
                  href={item.url}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-accent/10 text-foreground'
                      : 'text-muted hover:bg-[var(--color-card-hover)] hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition',
                      isActive ? 'text-accent' : 'text-current',
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {user ? (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 backdrop-blur-xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-background">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt={user.name ?? 'You'}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {user.name ?? 'You'}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-muted">{user.email}</p>
              ) : null}
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-loss/10 hover:text-loss"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
