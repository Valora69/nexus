'use client';

import { Button } from '@web/components/ui/button';
import { LogOut } from 'lucide-react';

interface ProfileHeaderProps {
  onLogout: () => void;
}

export function ProfileHeader({ onLogout }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-light text-muted">
        Identity and connections.
      </p>
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
