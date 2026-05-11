import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Badge } from '@web/components/ui/badge';
import { Users, Pencil } from 'lucide-react';
import type { GroupMember } from '@web/lib/types/entities';

type GroupMemberWithUser = GroupMember & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface GroupMembersCardProps {
  members: GroupMemberWithUser[];
  onEditGroup: () => void;
}

export function GroupMembersCard({
  members,
  onEditGroup,
}: GroupMembersCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Members ({members.length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onEditGroup}>
          <Pencil className="h-4 w-4 mr-1" /> Edit Group
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <Badge
              key={member.id}
              variant="secondary"
              className="text-sm py-1 px-3"
            >
              {member.user?.name || 'Unknown'}
            </Badge>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground">No members yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
