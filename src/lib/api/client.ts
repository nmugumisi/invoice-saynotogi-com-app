export interface ApiConfig {
  siteUrl: string;
  apiKey: string;
}

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

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, '');
}

async function request<T>(
  config: ApiConfig,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  // The ?rest_route= entry point works the same on every WordPress install
  // regardless of permalink settings, and — unlike the pretty /wp-json/
  // path — never triggers a canonical redirect that would drop CORS
  // headers or strip the Authorization header on browser-based clients.
  const url = `${normalizeSiteUrl(config.siteUrl)}/index.php?rest_route=/custom-invoices/v1${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CI-API-Key': config.apiKey,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err: any) {
    throw new Error(`Could not reach ${normalizeSiteUrl(config.siteUrl)} — check the site URL and your connection.`);
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
  testConnection: (config: ApiConfig) => request<ApiSettingsDto>(config, '/settings'),

  getSettings: (config: ApiConfig) => request<ApiSettingsDto>(config, '/settings'),
  updateSettings: (config: ApiConfig, patch: Record<string, unknown>) =>
    request<ApiSettingsDto>(config, '/settings', { method: 'POST', body: patch }),

  getClients: (config: ApiConfig) => request<ApiClientDto[]>(config, '/clients'),
  createClient: (config: ApiConfig, payload: Record<string, unknown>) =>
    request<ApiClientDto>(config, '/clients', { method: 'POST', body: payload }),
  updateClient: (config: ApiConfig, id: string, payload: Record<string, unknown>) =>
    request<ApiClientDto>(config, `/clients/${id}`, { method: 'POST', body: payload }),
  deleteClient: (config: ApiConfig, id: string) =>
    request<{ deleted: boolean }>(config, `/clients/${id}`, { method: 'DELETE' }),

  getPaymentMethods: (config: ApiConfig) => request<ApiPaymentMethodDto[]>(config, '/payment-methods'),
  createPaymentMethod: (config: ApiConfig, payload: Record<string, unknown>) =>
    request<ApiPaymentMethodDto>(config, '/payment-methods', { method: 'POST', body: payload }),
  updatePaymentMethod: (config: ApiConfig, id: string, payload: Record<string, unknown>) =>
    request<ApiPaymentMethodDto>(config, `/payment-methods/${id}`, { method: 'POST', body: payload }),
  deletePaymentMethod: (config: ApiConfig, id: string) =>
    request<{ deleted: boolean }>(config, `/payment-methods/${id}`, { method: 'DELETE' }),

  getInvoices: (config: ApiConfig) => request<ApiInvoiceDto[]>(config, '/invoices'),
  createInvoice: (config: ApiConfig, payload: Record<string, unknown>) =>
    request<ApiInvoiceDto>(config, '/invoices', { method: 'POST', body: payload }),
  updateInvoice: (config: ApiConfig, id: string, payload: Record<string, unknown>) =>
    request<ApiInvoiceDto>(config, `/invoices/${id}`, { method: 'POST', body: payload }),
  deleteInvoice: (config: ApiConfig, id: string) =>
    request<{ deleted: boolean }>(config, `/invoices/${id}`, { method: 'DELETE' }),
};
