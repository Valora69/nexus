'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import { Users, UserPlus, Eye } from 'lucide-react';
import type { User } from '@web/lib/types/entities';
import { getInitials } from '@web/lib/utils';

interface UsersListProps {
  users: User[];
  currentUserId: string;
  onBrowse: () => void;
  onViewUser: (user: User) => void;
}

export function UsersList({
  users,
  currentUserId,
  onBrowse,
  onViewUser,
}: UsersListProps) {
  const filteredUsers = users.filter((u) => u.id !== currentUserId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          All Users
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onBrowse}>
          <UserPlus className="h-4 w-4 mr-1" /> Browse
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredUsers.slice(0, 10).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 rounded hover:bg-muted/30 transition-colors"
            >
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => onViewUser(user)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.picture} />
                  <AvatarFallback className="bg-secondary text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onViewUser(user)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No other users found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
