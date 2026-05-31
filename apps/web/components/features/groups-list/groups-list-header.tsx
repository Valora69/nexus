'use client';

import { Button } from '@web/components/ui/button';
import { Plus } from 'lucide-react';

interface GroupsListHeaderProps {
  onCreateGroup: () => void;
}

export function GroupsListHeader({ onCreateGroup }: GroupsListHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-light text-muted">
        Manage your expense groups.
      </p>
      <Button onClick={onCreateGroup} size="sm">
        <Plus className="h-4 w-4" /> Create Group
      </Button>
    </div>
  );
}
