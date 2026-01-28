import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Users } from 'lucide-react';

export default function Groups() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Groups</h1>
        <p className="text-muted-foreground">Manage your expense groups</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockGroups.map((group) => (
          <Card
            key={group.id}
            className="border-glow-green-hover transition-all cursor-pointer hover:bg-muted/20"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{group.name}</CardTitle>
              </div>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm font-medium mb-2">
                  Members ({group.members.length})
                </p>
                <div className="space-y-1">
                  {group.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {member}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
