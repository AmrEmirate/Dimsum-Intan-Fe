/**
 * Currency Utility for Dimsum Intan POS
 * Handles Indonesian Rupiah thousands dot formatting (e.g. 10.000)
 */

/**
 * Formats a raw number or string into thousands dot format without Rp prefix
 * Example: 10000 -> "10.000", 1500000 -> "1.500.000"
 */
export function formatRupiahInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  const cleanDigits = str.replace(/\D/g, '');
  if (!cleanDigits) return '';
  return cleanDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Strips all non-digit characters from formatted Rupiah string
 * Example: "10.000" -> "10000", "Rp 150.000" -> "150000"
 */
export function parseRupiahInput(formatted: string | null | undefined): string {
  if (!formatted) return '';
  return String(formatted).replace(/\D/g, '');
}

/**
 * Converts formatted Rupiah string into integer number
 * Example: "10.000" -> 10000
 */
export function parseRupiahNumber(formatted: string | null | undefined): number {
  const digits = parseRupiahInput(formatted);
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Formats standard Rupiah display with Rp prefix
 * Example: 10000 -> "Rp 10.000"
 */
export function formatRupiah(value: number | string | null | undefined): string {
  const formatted = formatRupiahInput(value);
  return formatted ? `Rp ${formatted}` : 'Rp 0';
}
