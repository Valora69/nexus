'use client';

import { Card, CardContent } from '@web/components/ui/card';
import { Badge } from '@web/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@web/components/ui/avatar';
import { TabsContent } from '@web/components/ui/tabs';
import { Send, Clock } from 'lucide-react';
import type { FriendRequestWithRelations } from '@web/lib/types/entities';

interface SentRequestsListProps {
  requests: FriendRequestWithRelations[];
}

export function SentRequestsList({ requests }: SentRequestsListProps) {
  return (
    <TabsContent value="sent" className="mt-6">
      {requests.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No sent requests</p>
            <p className="text-sm mt-1">
              Requests you've sent will appear here until they're accepted.
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
                      <AvatarImage src={request.recipient?.picture} />
                      <AvatarFallback className="bg-muted">
                        {request.recipient?.name?.charAt(0).toUpperCase() ||
                          request.recipientEmail.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.recipient?.name || request.recipientEmail}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.recipientEmail}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" /> Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
