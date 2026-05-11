'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { Separator } from '@web/components/ui/separator';
import { User as UserIcon, Mail, Pencil, Smartphone } from 'lucide-react';
import type { User } from '@web/lib/types/entities';
import { getInitials } from '@web/lib/utils';

interface ProfileCardProps {
  user: User;
  onEdit: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Account Details</CardTitle>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-bold">{user.name}</p>
            <Badge variant="secondary" className="mt-1">
              Active Trader
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">GCash Number</p>
              {user.gcashNumber ? (
                <p className="font-medium font-mono">{user.gcashNumber}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Not set —{' '}
                  <button
                    onClick={onEdit}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Add now
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
