'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@web/components/ui/dialog';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Button } from '@web/components/ui/button';
import { Badge } from '@web/components/ui/badge';
import type { User } from '@web/lib/types/entities';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description: string;
  selectedUserIds: string[];
  users: User[];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onToggleUser: (userId: string) => void;
  onCreate: () => void;
  isPending: boolean;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  name,
  description,
  selectedUserIds,
  users,
  onNameChange,
  onDescriptionChange,
  onToggleUser,
  onCreate,
  isPending,
}: CreateGroupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              placeholder="e.g. Weekend Trip, Office Team"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="What's this group for?"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Add Members</Label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <Badge
                  key={user.id}
                  variant={
                    selectedUserIds.includes(user.id) ? 'default' : 'outline'
                  }
                  className="cursor-pointer transition-colors"
                  onClick={() => onToggleUser(user.id)}
                >
                  {user.name}
                </Badge>
              ))}
            </div>
            {selectedUserIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedUserIds.length} member(s) selected
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!name.trim() || isPending}>
            {isPending ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
