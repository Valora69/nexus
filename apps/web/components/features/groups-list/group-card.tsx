'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Users } from 'lucide-react';
import type { GroupWithRelations } from '@web/lib/types/entities';

interface GroupCardProps {
  group: GroupWithRelations;
  onClick: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const memberCount = group.members?.length ?? 0;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/20 hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-normal">{group.name}</CardTitle>
        </div>
        <CardDescription className="font-light">
          {group.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          <p className="text-sm font-light text-muted-foreground mb-2">
            Members ({memberCount})
          </p>
          <div className="space-y-1">
            {group.members?.slice(0, 5).map((member) => (
              <div
                key={member.id}
                className="text-xs text-muted-foreground font-light flex items-center gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-primary" />
                {member.user?.name || 'Unknown'}
              </div>
            ))}
            {memberCount > 5 && (
              <p className="text-xs text-muted-foreground font-light ml-4">
                +{memberCount - 5} more
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
