import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { User, Mail } from 'lucide-react';

export default function Profile() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {mockUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-xl font-bold">{mockUser.name}</p>
                <p className="text-sm text-muted-foreground">Active Trader</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{mockUser.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{mockUser.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
