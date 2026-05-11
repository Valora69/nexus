import { Button } from '@web/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface GroupHeaderProps {
  name: string;
  description?: string | null;
  onBack: () => void;
}

export function GroupHeader({ name, description, onBack }: GroupHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="text-muted-foreground">
          {description || 'No description'}
        </p>
      </div>
    </div>
  );
}
