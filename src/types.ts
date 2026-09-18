export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface PaymentMethod {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface InvoiceItem {
  id: string;
  desc: string;
  description: string;
  qty: number;
  price: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string; // ISO yyyy-mm-dd
  dueDate: string; // ISO yyyy-mm-dd
  clientId: string | null;
  billToName: string;
  billToAddress: string;
  billToEmail: string;
  billToPhone: string;
  items: InvoiceItem[];
  notes: string;
  paymentMethodIds: string[];
  amountPaid: number;
  showZar: boolean;
  showBwp: boolean;
  zarTotal: number | null;
  zarRateUsed: number | null;
  bwpTotal: number | null;
  bwpRateUsed: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logoUri: string | null;
  invoicePrefix: string;
  startNumber: number;
  currencySymbol: string;
  currencyCode: string;
  defaultNotes: string;
  zarRate: number | null;
  bwpRate: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  logoUri: null,
  invoicePrefix: 'INV-',
  startNumber: 1,
  currencySymbol: 'US$',
  currencyCode: 'USD',
  defaultNotes: '',
  zarRate: null,
  bwpRate: null,
};

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid';

export function invoiceTotal(invoice: Pick<Invoice, 'items'>): number {
  return invoice.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

export function invoiceStatus(invoice: Pick<Invoice, 'items' | 'amountPaid'>): InvoiceStatus {
  const total = invoiceTotal(invoice);
  const due = Math.max(0, total - invoice.amountPaid);
  if (total > 0 && due <= 0.001) return 'paid';
  if (invoice.amountPaid > 0) return 'partial';
  return 'unpaid';
}
