'use client';

import { Button } from '@web/components/ui/button';
import { Plus } from 'lucide-react';

interface GroupsListHeaderProps {
  onCreateGroup: () => void;
}

export function GroupsListHeader({ onCreateGroup }: GroupsListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Groups</h1>
        <p className="text-muted-foreground">Manage your expense groups</p>
      </div>
      <Button onClick={onCreateGroup} size="sm">
        <Plus className="h-4 w-4 mr-2" /> Create Group
      </Button>
    </div>
  );
}
