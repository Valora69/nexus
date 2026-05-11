interface ExpensesHeaderProps {
  title: string;
  description: string;
}

export function ExpensesHeader({ title, description }: ExpensesHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
