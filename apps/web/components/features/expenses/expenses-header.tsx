interface ExpensesHeaderProps {
  title: string;
  description: string;
}

export function ExpensesHeader({ title, description }: ExpensesHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-light tracking-wide">{title}</h1>
      <p className="text-muted-foreground text-sm font-light">{description}</p>
    </div>
  );
}
