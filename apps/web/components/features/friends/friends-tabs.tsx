'use client';

import { Badge } from '@web/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@web/components/ui/tabs';
import { Users, Mail, Send } from 'lucide-react';

interface FriendsTabsProps {
  friendsCount: number;
  pendingCount: number;
  sentCount: number;
  children: React.ReactNode;
}

export function FriendsTabs({
  friendsCount,
  pendingCount,
  sentCount,
  children,
}: FriendsTabsProps) {
  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="friends" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Friends
          {friendsCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {friendsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="requests" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Requests
          {pendingCount > 0 && (
            <Badge variant="default" className="ml-1 bg-primary">
              {pendingCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Sent
          {sentCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {sentCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
