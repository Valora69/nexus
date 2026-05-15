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
import { X, AlertCircle } from 'lucide-react';
import type { GroupWithRelations, User } from '@web/lib/types/entities';

export interface EditGroupData {
  name: string;
  description?: string;
}

export interface RemovalBlocker {
  type: string;
  message: string;
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
  /** Per-member blockers from the most recent failed remove attempt */
  blockersByMemberId?: Record<string, RemovalBlocker[]>;
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
  blockersByMemberId = {},
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
  const addableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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

          <div className="space-y-2">
            <Label>Members ({members.length})</Label>
            <div className="space-y-2">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">No members yet</p>
              )}
              {members.map((member) => {
                const memberBlockers = blockersByMemberId[member.id] ?? [];
                const hasBlockers = memberBlockers.length > 0;
                return (
                  <div key={member.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
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
                    </div>
                    {hasBlockers && (
                      <div className="ml-1 p-2 rounded border border-destructive/30 bg-destructive/5 space-y-1">
                        <div className="flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          Cannot remove — unsettled balances
                        </div>
                        <ul className="text-xs text-destructive/90 space-y-0.5 pl-4 list-disc">
                          {memberBlockers.map((b, i) => (
                            <li key={i}>{b.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
