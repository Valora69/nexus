interface PaymentsHeaderProps {
  title: string;
  description: string;
}

export function PaymentsHeader({ title, description }: PaymentsHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-light tracking-wide">{title}</h1>
      <p className="text-muted-foreground text-sm font-light">{description}</p>
    </div>
  );
}
