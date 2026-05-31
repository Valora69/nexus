'use client';

import { Button } from '@web/components/ui/button';
import { UserPlus } from 'lucide-react';

interface FriendsHeaderProps {
  onAddFriend: () => void;
}

export function FriendsHeader({ onAddFriend }: FriendsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-light text-muted">Manage your connections.</p>
      <Button onClick={onAddFriend} size="sm">
        <UserPlus className="h-4 w-4" /> Add Friend
      </Button>
    </div>
  );
}
