/**
 * Date and Time Formatting Utilities
 *
 * Centralized formatters to ensure consistent date/time display across the app.
 * Uses en-US locale for Philippine peso (₱) formatting compatibility.
 */

/**
 * Format a date string to a readable date (e.g., "January 15, 2026")
 */
export function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string to a short date (e.g., "1/15/2026")
 */
export function formatDateShort(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US');
}

/**
 * Format a date string to time (e.g., "3:30 PM")
 */
export function formatTime(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date string to full datetime (e.g., "January 15, 2026 at 3:30 PM")
 */
export function formatDateTime(dateString: string | Date): string {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

/**
 * Format a date string to relative time (e.g., "2 hours ago", "yesterday")
 * Useful for activity feeds and recent items
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDateShort(date);
}

/**
 * Currency Formatting Utilities
 *
 * Ensures consistent currency display. Defaults to PHP (₱) for this app.
 */

export type CurrencyCode = 'PHP' | 'USD';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  PHP: '₱',
  USD: '$',
};

/**
 * Format a number as currency (e.g., "₱1,234.56")
 * @param amount - The amount to format
 * @param currency - Currency code (defaults to PHP)
 * @param showSymbol - Whether to include the currency symbol (defaults to true)
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'PHP',
  showSymbol: boolean = true,
): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!showSymbol) return formatted;

  const symbol = CURRENCY_SYMBOLS[currency];
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Format currency for display with sign indicator
 * Positive amounts show as "+₱100.00", negative as "-₱100.00"
 */
export function formatCurrencyWithSign(
  amount: number,
  currency: CurrencyCode = 'PHP',
): string {
  const formatted = formatCurrency(Math.abs(amount), currency);
  if (amount > 0) return `+${formatted}`;
  if (amount < 0)
    return `-${formatted.replace(CURRENCY_SYMBOLS[currency], '')}`;
  return formatted;
}

/**
 * Text Formatting Utilities
 */

/**
 * Truncate text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (defaults to "...")
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = '...',
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
