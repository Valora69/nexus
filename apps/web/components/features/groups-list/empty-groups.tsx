'use client';

import { Card, CardContent } from '@web/components/ui/card';
import { Users } from 'lucide-react';

export function EmptyGroups() {
  return (
    <Card className="border-border">
      <CardContent className="py-12 text-center text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-normal">No groups yet</p>
        <p className="text-sm font-light mt-1">
          Create your first group to start splitting expenses.
        </p>
      </CardContent>
    </Card>
  );
}
