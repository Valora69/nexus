'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Separator } from '@web/components/ui/separator';
import { Smartphone } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
  gcashNumber: string;
  onNameChange: (name: string) => void;
  onGcashNumberChange: (gcashNumber: string) => void;
  onSave: () => void;
  isPending?: boolean;
}

export function EditProfileModal({
  isOpen,
  onClose,
  name,
  email,
  gcashNumber,
  onNameChange,
  onGcashNumberChange,
  onSave,
  isPending,
}: EditProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Email is managed through Google and cannot be changed here.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              GCash Number
            </Label>
            <Input
              type="tel"
              placeholder="e.g. 09171234567"
              value={gcashNumber}
              onChange={(e) => onGcashNumberChange(e.target.value)}
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">
              Your GCash mobile number so others can pay you directly.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
