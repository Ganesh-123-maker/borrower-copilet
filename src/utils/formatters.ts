/**
 * @file src/utils/formatters.ts
 * @description Currency and number formatters for Indian Rupee (INR) system.
 */

/**
 * Format a number into Indian Rupee string (e.g. ₹8,00,000)
 */
export function formatINR(amount: number, includeSymbol: boolean = true): string {
  if (isNaN(amount)) return includeSymbol ? '₹0' : '0';

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  // Use Intl with en-IN locale
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(absAmount);

  const prefix = isNegative ? '- ' : '';
  const symbol = includeSymbol ? '₹' : '';

  return `${prefix}${symbol}${formatted}`;
}

/**
 * Format large INR amounts into Indian notation (Lakhs / Crores)
 * e.g., 1500000 -> ₹15 Lakhs
 */
export function formatINRWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';

  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    const cr = (absAmount / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Crore${Number(cr) > 1 ? 's' : ''}`;
  }

  if (absAmount >= 100000) {
    const lk = (absAmount / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${lk} Lakh${Number(lk) > 1 ? 's' : ''}`;
  }

  if (absAmount >= 1000) {
    const th = (absAmount / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${th}k`;
  }

  return formatINR(amount);
}

/**
 * Format percentage
 */
export function formatPercent(rate: number, fractionDigits: number = 1): string {
  return `${rate.toFixed(fractionDigits)}%`;
}
