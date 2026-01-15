import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Badge, DollarSign } from 'lucide-react';

export default function Payments() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-muted-foreground">View payment history and status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded hover:border-primary/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {payment.from} → {payment.to}
                    </p>
                    <Badge
                      variant={
                        payment.status === 'completed' ? 'default' : 'secondary'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {payment.groupName} •{' '}
                    {new Date(payment.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right mt-2 md:mt-0">
                  <p className="text-lg font-mono font-bold text-primary">
                    ${payment.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
