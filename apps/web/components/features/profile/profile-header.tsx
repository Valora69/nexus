'use client';

import { Button } from '@web/components/ui/button';
import { LogOut } from 'lucide-react';

interface ProfileHeaderProps {
  onLogout: () => void;
}

export function ProfileHeader({ onLogout }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-light tracking-wide">Account</h1>
        <p className="text-muted-foreground text-sm font-light">Identity and connections</p>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={onLogout}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
