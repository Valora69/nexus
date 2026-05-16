/**
 * User-related Utility Functions
 *
 * Helper functions for user display and formatting.
 */

/**
 * Get initials from a user's name for avatar fallbacks
 * - Single word: First two characters (e.g., "John" → "JO")
 * - Multiple words: First letter of first two words (e.g., "John Doe" → "JD")
 * - Empty/undefined: Returns default "U"
 *
 * @param name - The user's full name
 * @param defaultInitial - Fallback character if name is empty (defaults to "U")
 */
export function getInitials(
  name?: string | null,
  defaultInitial: string = 'U',
): string {
  if (!name?.trim()) return defaultInitial;

  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
}

/**
 * Get a user's display name (full name or email fallback)
 * Useful when name might be empty but email is available
 */
export function getDisplayName(
  name?: string | null,
  email?: string | null,
  fallback: string = 'Unknown User',
): string {
  if (name?.trim()) return name.trim();
  if (email) return email.split('@')[0]!;
  return fallback;
}

/**
 * Format a user's name for display with optional truncation
 */
export function formatUserName(name: string, maxLength?: number): string {
  const trimmed = name.trim();
  if (!maxLength || trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 3) + '...';
}

/**
 * Check if a string is a valid email format
 * Basic validation - not meant for exhaustive email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format phone number for display (Philippine format)
 * Input: "09171234567" → "0917 123 4567"
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '';

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Philippine mobile format: 0917 123 4567
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  // Return as-is if doesn't match expected format
  return phone;
}
