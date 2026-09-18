import { Invoice, Settings } from '../types';

/**
 * Mirrors the plugin's numbering: one more than the highest number among
 * existing invoices, or the configured starting number if none exist yet.
 */
export function nextInvoiceNumber(invoices: Invoice[], settings: Settings): string {
  const prefix = settings.invoicePrefix ?? '';
  const start = settings.startNumber ?? 1;

  let max = 0;
  for (const invoice of invoices) {
    const digits = invoice.number.replace(/[^0-9]/g, '');
    if (!digits) continue;
    const value = parseInt(digits, 10);
    if (value > max) max = value;
  }

  const next = max > 0 ? max + 1 : Math.max(start, 0);
  return prefix + String(next).padStart(4, '0');
}
