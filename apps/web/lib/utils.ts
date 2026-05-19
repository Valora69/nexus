import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export all utility functions for convenient importing
// Usage: import { cn, formatDate, getInitials } from '@web/lib/utils'
export * from './utils/formatters';
export * from './utils/user';
export * from './utils/splits';
