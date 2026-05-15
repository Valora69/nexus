'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@web/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { QuickCaptureModal } from './QuickCaptureModal';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/components/ui/dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [captureOpen, setCaptureOpen] = useState(false);

  // Detect group context from URL — e.g. /groups/abc123 or /groups/abc123/anything
  const groupRouteMatch = pathname?.match(/^\/groups\/([^/]+)/);
  const currentGroupId =
    groupRouteMatch && groupRouteMatch[1] !== undefined
      ? groupRouteMatch[1]
      : undefined;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when focus is inside any text input to avoid hijacking typing
      const tag = (e.target as HTMLElement).tagName;
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable;

      if (!isEditable && e.key === 'b' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm font-light tracking-wide">Loading...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen>
      <QuickCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        groupId={currentGroupId}
      />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />

            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
                  <span className="text-sm font-light hidden md:inline">
                    {currentUser.name}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={currentUser.picture}
                      alt={currentUser.name}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-normal">
                        {currentUser.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-light">
                        {currentUser.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
