'use client';

import { GroupCard } from './group-card';
import type { GroupWithRelations } from '@web/lib/types/entities';

interface GroupsGridProps {
  groups: GroupWithRelations[];
  onGroupClick: (groupId: string) => void;
}

export function GroupsGrid({ groups, onGroupClick }: GroupsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={() => onGroupClick(group.id)}
        />
      ))}
    </div>
  );
}
