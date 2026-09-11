'use client';

import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { Bell } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@web/components/ui/sheet';
import { useUnreadNotificationCount } from '@web/lib/client/queries/notificationQueries';
import { cn } from '@web/lib/utils';
import { NotificationCenter } from './notification-center';

interface NotificationBellProps {
  /** Popover under the desktop top bar; full-height sheet on mobile. */
  variant: 'popover' | 'sheet';
}

type BellButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  count: number;
};

/** forwardRef so Radix `asChild` triggers can attach their ref/handlers. */
const BellButton = forwardRef<HTMLButtonElement, BellButtonProps>(
  function BellButton({ count, className, ...props }, ref) {
    const label =
      count > 0 ? `Notifications, ${count} unread` : 'Notifications';
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          'glass relative inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          count > 0 ? 'text-foreground' : 'text-muted',
          className,
        )}
        {...props}
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-background shadow-glow">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
    );
  },
);

export function NotificationBell({ variant }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadNotificationCount();

  const center = (
    <NotificationCenter
      open={open}
      unreadCount={count}
      onNavigate={() => setOpen(false)}
    />
  );

  if (variant === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <BellButton count={count} />
        </SheetTrigger>
        <SheetContent
          side="right"
          className="flex w-[92vw] max-w-sm flex-col p-0 pt-12 max-h-screen"
        >
          <SheetTitle className="sr-only">Notifications</SheetTitle>
          <SheetDescription className="sr-only">
            Your recent notifications
          </SheetDescription>
          {center}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <BellButton count={count} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex max-h-[70vh] w-[400px] max-w-[calc(100vw-2rem)] flex-col"
      >
        {center}
      </PopoverContent>
    </Popover>
  );
}
