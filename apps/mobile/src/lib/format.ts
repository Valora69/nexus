/** Format an amount as PHP currency (the app's GCash/cash domain). */
export function formatAmount(value: number | undefined | null): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `₱${n.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
