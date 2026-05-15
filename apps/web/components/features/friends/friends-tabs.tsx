'use client';

import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@web/components/ui/tabs';
import { Users, Mail, UserPlus } from 'lucide-react';

interface FriendsTabsProps {
  friendsCount: number;
  pendingCount: number;
  onAddFriend: () => void;
  children: React.ReactNode;
}

export function FriendsTabs({
  friendsCount,
  pendingCount,
  onAddFriend,
  children,
}: FriendsTabsProps) {
  return (
    <Tabs defaultValue="friends" className="w-full">
      <div className="flex items-center gap-2">
        <TabsList className="grid grid-cols-2 flex-1">
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
        </TabsList>
        <Button size="sm" variant="outline" onClick={onAddFriend} className="shrink-0">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Add Friend
        </Button>
      </div>
      {children}
    </Tabs>
  );
}
