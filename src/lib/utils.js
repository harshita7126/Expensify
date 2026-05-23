import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges multiple Tailwind classes conditionally and safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given number into Indian Rupee (INR) string representation.
 * Example: 125000 -> ₹1,25,000.00
 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
