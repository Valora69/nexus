interface PaymentsHeaderProps {
  title: string;
  description: string;
}

export function PaymentsHeader({ title, description }: PaymentsHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
