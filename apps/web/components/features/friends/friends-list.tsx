'use client';

import { Card, CardContent } from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { TabsContent } from '@web/components/ui/tabs';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import type { Friend } from '@web/lib/types/entities';

interface FriendsListProps {
  friends: Friend[];
  onAddFriend: () => void;
  onRemoveFriend: (friend: Friend) => void;
}

export function FriendsList({
  friends,
  onAddFriend,
  onRemoveFriend,
}: FriendsListProps) {
  return (
    <TabsContent value="friends" className="mt-6">
      {friends.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-normal">No friends yet</p>
            <p className="text-sm font-light mt-1">
              Add friends to start splitting expenses together.
            </p>
            <Button onClick={onAddFriend} className="mt-4" size="sm">
              <UserPlus className="h-4 w-4 mr-2" /> Add Your First Friend
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <Card
              key={friend.id}
              className="border-border hover:bg-muted/10 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={friend.picture} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {friend.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-normal">{friend.name}</p>
                      <p className="text-sm text-muted-foreground font-light">
                        {friend.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFriend(friend)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
