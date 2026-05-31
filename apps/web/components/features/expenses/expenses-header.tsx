interface ExpensesHeaderProps {
  title: string;
  description: string;
}

/**
 * The sticky topbar already owns the page title. This header only renders
 * the contextual subtitle so the page header stays a single, soft line.
 */
export function ExpensesHeader({ title, description }: ExpensesHeaderProps) {
  return (
    <p className="text-sm font-light text-muted">
      <span className="font-normal text-accent">{title} ·</span> {description}
    </p>
  );
}
