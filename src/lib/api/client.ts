import { API_BASE_URL, API_KEY } from '../../config';

export interface ApiClientDto {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface ApiPaymentMethodDto {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ApiInvoiceItemDto {
  desc: string;
  description: string;
  qty: number;
  price: number;
}

export interface ApiInvoiceDto {
  id: string;
  number: string;
  date: string;
  due_date: string;
  client_id: string | null;
  bill_to_name: string;
  bill_to_address: string;
  bill_to_email: string;
  bill_to_phone: string;
  items: ApiInvoiceItemDto[];
  notes: string;
  payment_method_ids: string[];
  amount_paid: number;
  total: number;
  amount_due: number;
  status: 'paid' | 'partial' | 'unpaid';
  show_zar: boolean;
  show_bwp: boolean;
  zar_total: number | null;
  zar_rate_used: number | null;
  bwp_total: number | null;
  bwp_rate_used: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApiSettingsDto {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  logo_url: string;
  invoice_prefix: string;
  start_number: number;
  currency_symbol: string;
  currency_code: string;
  default_notes: string;
  zar_rate: number | null;
  bwp_rate: number | null;
}

export interface ApiSettingsWithRateSourceDto extends ApiSettingsDto {
  rate_source: string;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  // The ?rest_route= entry point works the same on every WordPress install
  // regardless of permalink settings, and — unlike the pretty /wp-json/
  // path — never triggers a canonical redirect that could drop headers.
  const url = `${API_BASE_URL}/index.php?rest_route=/custom-invoices/v1${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CI-API-Key': API_KEY,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Could not reach the server — check your connection and try again.');
  }

  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!response.ok) {
    const message =
      json && typeof json.message === 'string'
        ? json.message
        : `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return json as T;
}

export const wpApi = {
  getSettings: () => request<ApiSettingsDto>('/settings'),
  updateSettings: (patch: Record<string, unknown>) =>
    request<ApiSettingsDto>('/settings', { method: 'POST', body: patch }),
  fetchRates: () => request<ApiSettingsWithRateSourceDto>('/settings/fetch-rates', { method: 'POST' }),

  getClients: () => request<ApiClientDto[]>('/clients'),
  createClient: (payload: Record<string, unknown>) =>
    request<ApiClientDto>('/clients', { method: 'POST', body: payload }),
  updateClient: (id: string, payload: Record<string, unknown>) =>
    request<ApiClientDto>(`/clients/${id}`, { method: 'POST', body: payload }),
  deleteClient: (id: string) => request<{ deleted: boolean }>(`/clients/${id}`, { method: 'DELETE' }),

  getPaymentMethods: () => request<ApiPaymentMethodDto[]>('/payment-methods'),
  createPaymentMethod: (payload: Record<string, unknown>) =>
    request<ApiPaymentMethodDto>('/payment-methods', { method: 'POST', body: payload }),
  updatePaymentMethod: (id: string, payload: Record<string, unknown>) =>
    request<ApiPaymentMethodDto>(`/payment-methods/${id}`, { method: 'POST', body: payload }),
  deletePaymentMethod: (id: string) =>
    request<{ deleted: boolean }>(`/payment-methods/${id}`, { method: 'DELETE' }),

  getInvoices: () => request<ApiInvoiceDto[]>('/invoices'),
  createInvoice: (payload: Record<string, unknown>) =>
    request<ApiInvoiceDto>('/invoices', { method: 'POST', body: payload }),
  updateInvoice: (id: string, payload: Record<string, unknown>) =>
    request<ApiInvoiceDto>(`/invoices/${id}`, { method: 'POST', body: payload }),
  deleteInvoice: (id: string) => request<{ deleted: boolean }>(`/invoices/${id}`, { method: 'DELETE' }),
};
