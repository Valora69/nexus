'use client';

import { Button } from '@web/components/ui/button';
import { UserPlus } from 'lucide-react';

interface FriendsHeaderProps {
  onAddFriend: () => void;
}

export function FriendsHeader({ onAddFriend }: FriendsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your connections</p>
      </div>
      <Button onClick={onAddFriend} size="sm">
        <UserPlus className="h-4 w-4 mr-2" /> Add Friend
      </Button>
    </div>
  );
}
