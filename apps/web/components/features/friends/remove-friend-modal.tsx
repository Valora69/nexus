'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import type { Friend } from '@web/lib/types/entities';

interface RemoveFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: Friend | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function RemoveFriendModal({
  isOpen,
  onClose,
  friend,
  onConfirm,
  isPending,
}: RemoveFriendModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Friend</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{' '}
            <span className="font-semibold text-foreground">
              {friend?.name}
            </span>{' '}
            from your friends? You can always add them back later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Removing...' : 'Remove Friend'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
