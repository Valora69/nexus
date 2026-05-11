'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Separator } from '@web/components/ui/separator';
import { Mail } from 'lucide-react';
import type { User } from '@web/lib/types/entities';
import { getInitials } from '@web/lib/utils';

interface ViewUserModalProps {
  user: User | null;
  onClose: () => void;
}

export function ViewUserModal({ user, onClose }: ViewUserModalProps) {
  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {user && (
          <>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.picture} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-bold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
