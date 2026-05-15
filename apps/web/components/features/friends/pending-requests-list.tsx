'use client';

import { Card, CardContent } from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { TabsContent } from '@web/components/ui/tabs';
import { Mail, Check, X } from 'lucide-react';
import type { FriendRequestWithRelations } from '@web/lib/types/entities';

interface PendingRequestsListProps {
  requests: FriendRequestWithRelations[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function PendingRequestsList({
  requests,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: PendingRequestsListProps) {
  return (
    <TabsContent value="requests" className="mt-6">
      {requests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-normal">No pending requests</p>
            <p className="text-sm font-light mt-1">
              When someone sends you a friend request, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.sender.picture} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {request.sender.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-normal">{request.sender.name}</p>
                      <p className="text-sm text-muted-foreground font-light">
                        {request.sender.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAccept(request.id)}
                      disabled={isAccepting}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecline(request.id)}
                      disabled={isDeclining}
                    >
                      <X className="h-4 w-4 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
