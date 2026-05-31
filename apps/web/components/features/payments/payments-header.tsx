interface PaymentsHeaderProps {
  title: string;
  description: string;
}

export function PaymentsHeader({ title, description }: PaymentsHeaderProps) {
  return (
    <p className="text-sm font-light text-muted">
      <span className="font-normal text-accent">{title} ·</span> {description}
    </p>
  );
}
