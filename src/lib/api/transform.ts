import { generateId } from '../id';
import { Client, Invoice, PaymentMethod, Settings } from '../../types';
import { ApiClientDto, ApiInvoiceDto, ApiPaymentMethodDto, ApiSettingsDto } from './client';

export function fromApiClient(dto: ApiClientDto): Client {
  return {
    id: dto.id,
    name: dto.name ?? '',
    address: dto.address ?? '',
    email: dto.email ?? '',
    phone: dto.phone ?? '',
  };
}

export function toApiClientPayload(client: Omit<Client, 'id'>): Record<string, unknown> {
  return {
    name: client.name,
    address: client.address,
    email: client.email,
    phone: client.phone,
  };
}

export function fromApiPaymentMethod(dto: ApiPaymentMethodDto): PaymentMethod {
  return {
    id: dto.id,
    title: dto.title ?? '',
    content: dto.content ?? '',
    order: dto.order ?? 0,
  };
}

export function toApiPaymentMethodPayload(method: Omit<PaymentMethod, 'id'>): Record<string, unknown> {
  return {
    title: method.title,
    content: method.content,
    order: method.order,
  };
}

export function fromApiInvoice(dto: ApiInvoiceDto): Invoice {
  const now = new Date().toISOString();
  return {
    id: dto.id,
    number: dto.number ?? '',
    date: dto.date ?? '',
    dueDate: dto.due_date ?? '',
    clientId: dto.client_id,
    billToName: dto.bill_to_name ?? '',
    billToAddress: dto.bill_to_address ?? '',
    billToEmail: dto.bill_to_email ?? '',
    billToPhone: dto.bill_to_phone ?? '',
    items: (dto.items ?? []).map((item) => ({
      id: generateId(),
      desc: item.desc ?? '',
      description: item.description ?? '',
      qty: item.qty ?? 0,
      price: item.price ?? 0,
    })),
    notes: dto.notes ?? '',
    paymentMethodIds: dto.payment_method_ids ?? [],
    amountPaid: dto.amount_paid ?? 0,
    showZar: !!dto.show_zar,
    showBwp: !!dto.show_bwp,
    zarTotal: dto.zar_total,
    zarRateUsed: dto.zar_rate_used,
    bwpTotal: dto.bwp_total,
    bwpRateUsed: dto.bwp_rate_used,
    createdAt: dto.created_at ?? now,
    updatedAt: dto.updated_at ?? now,
  };
}

export function toApiInvoicePayload(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
  return {
    number: invoice.number,
    date: invoice.date,
    due_date: invoice.dueDate,
    client_id: invoice.clientId,
    items: invoice.items.map((item) => ({
      desc: item.desc,
      description: item.description,
      qty: item.qty,
      price: item.price,
    })),
    notes: invoice.notes,
    payment_method_ids: invoice.paymentMethodIds,
    amount_paid: invoice.amountPaid,
    show_zar: invoice.showZar,
    show_bwp: invoice.showBwp,
  };
}

export function fromApiSettings(dto: ApiSettingsDto): Settings {
  return {
    companyName: dto.company_name ?? '',
    companyAddress: dto.company_address ?? '',
    companyPhone: dto.company_phone ?? '',
    companyEmail: dto.company_email ?? '',
    logoUri: dto.logo_url || null,
    invoicePrefix: dto.invoice_prefix ?? '',
    startNumber: dto.start_number ?? 1,
    currencySymbol: dto.currency_symbol ?? 'US$',
    currencyCode: dto.currency_code ?? 'USD',
    defaultNotes: dto.default_notes ?? '',
    zarRate: dto.zar_rate,
    bwpRate: dto.bwp_rate,
  };
}

const SETTINGS_FIELD_MAP: Partial<Record<keyof Settings, string>> = {
  companyName: 'company_name',
  companyAddress: 'company_address',
  companyPhone: 'company_phone',
  companyEmail: 'company_email',
  invoicePrefix: 'invoice_prefix',
  startNumber: 'start_number',
  currencySymbol: 'currency_symbol',
  currencyCode: 'currency_code',
  defaultNotes: 'default_notes',
  zarRate: 'zar_rate',
  bwpRate: 'bwp_rate',
};

/** Logo upload isn't supported by the API yet, so `logoUri` is never sent. */
export function toApiSettingsPayload(patch: Partial<Settings>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, apiKey] of Object.entries(SETTINGS_FIELD_MAP) as [keyof Settings, string][]) {
    if (key in patch) {
      payload[apiKey] = patch[key];
    }
  }
  return payload;
}
