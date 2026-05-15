'use client';

import { Card, CardContent } from '@web/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { Button } from '@web/components/ui/button';
import { Pencil, Smartphone, Mail } from 'lucide-react';
import type { User } from '@web/lib/types/entities';
import { getInitials } from '@web/lib/utils';

interface ProfileCardProps {
  user: User;
  onEdit: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-light">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-xl font-light tracking-wide truncate">{user.name}</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground font-light truncate">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                {user.gcashNumber ? (
                  <span className="text-sm font-mono">{user.gcashNumber}</span>
                ) : (
                  <button
                    onClick={onEdit}
                    className="text-sm text-primary underline underline-offset-2 hover:text-primary/80 font-light"
                  >
                    Add GCash number
                  </button>
                )}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onEdit} className="shrink-0 -mt-1">
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
