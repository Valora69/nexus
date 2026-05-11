'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Eye } from 'lucide-react';
import type { User } from '@web/lib/types/entities';
import { getInitials } from '@web/lib/utils';

interface BrowseUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewUser: (user: User) => void;
}

export function BrowseUsersModal({
  isOpen,
  onClose,
  users,
  searchQuery,
  onSearchChange,
  onViewUser,
}: BrowseUsersModalProps) {
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Browse Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-secondary text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewUser(user)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
