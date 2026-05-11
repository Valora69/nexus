'use client';

import React, { useState, useEffect } from 'react';
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
import { X } from 'lucide-react';
import type { GroupWithRelations, User } from '@web/lib/types/entities';

export interface EditGroupData {
  name: string;
  description?: string;
}

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupWithRelations | null;
  allUsers: User[];
  onSave: (data: EditGroupData) => void;
  onAddMember: (userId: string) => void;
  onRemoveMember: (groupMemberId: string) => void;
  isLoading?: boolean;
}

export function EditGroupModal({
  isOpen,
  onClose,
  group,
  allUsers,
  onSave,
  onAddMember,
  onRemoveMember,
  isLoading = false,
}: EditGroupModalProps) {
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (group && isOpen) {
      setEditName(group.name);
      setEditDesc(group.description || '');
    }
  }, [group, isOpen]);

  const handleSave = () => {
    if (!editName.trim()) return;
    onSave({ name: editName.trim(), description: editDesc.trim() || undefined });
  };

  if (!group) return null;

  const members = group.members ?? [];
  const memberUserIds = new Set(members.map((m) => m.userId));

  // Users not yet in the group
  const addableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Group Name *</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Enter group description (optional)"
            />
          </div>

          {/* Current members with remove button */}
          <div className="space-y-2">
            <Label>Members ({members.length})</Label>
            <div className="flex flex-wrap gap-2">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">No members yet</p>
              )}
              {members.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {member.user?.name || 'Unknown'}
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                    aria-label={`Remove ${member.user?.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Add new members */}
          {addableUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Add Members</Label>
              <div className="flex flex-wrap gap-2">
                {addableUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onAddMember(user.id)}
                  >
                    + {user.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !editName.trim()}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
