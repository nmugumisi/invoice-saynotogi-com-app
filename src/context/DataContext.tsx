import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { wpApi } from '../lib/api/client';
import {
  fromApiClient,
  fromApiInvoice,
  fromApiPaymentMethod,
  fromApiSettings,
  toApiClientPayload,
  toApiInvoicePayload,
  toApiPaymentMethodPayload,
  toApiSettingsPayload,
} from '../lib/api/transform';
import { Client, DEFAULT_SETTINGS, Invoice, PaymentMethod, Settings } from '../types';

interface DataContextValue {
  loading: boolean;
  loadError: string | null;
  syncing: boolean;
  clients: Client[];
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  settings: Settings;

  refreshAll: () => Promise<void>;
  fetchExchangeRates: () => Promise<{ source: string }>;

  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;

  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => Promise<PaymentMethod>;
  updatePaymentMethod: (id: string, patch: Partial<Omit<PaymentMethod, 'id'>>) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, patch: Partial<Omit<Invoice, 'id'>>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const loadAll = useCallback(async () => {
    const [clientsDto, methodsDto, invoicesDto, settingsDto] = await Promise.all([
      wpApi.getClients(),
      wpApi.getPaymentMethods(),
      wpApi.getInvoices(),
      wpApi.getSettings(),
    ]);
    setClients(clientsDto.map(fromApiClient).sort((a, b) => a.name.localeCompare(b.name)));
    setPaymentMethods(
      methodsDto.map(fromApiPaymentMethod).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    );
    setInvoices(invoicesDto.map(fromApiInvoice));
    setSettings(fromApiSettings(settingsDto));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadAll();
      } catch (err: any) {
        setLoadError(err?.message ?? 'Could not reach the server.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  const refreshAll = useCallback(async () => {
    setSyncing(true);
    setLoadError(null);
    try {
      await loadAll();
    } catch (err: any) {
      setLoadError(err?.message ?? 'Could not reach the server.');
    } finally {
      setSyncing(false);
    }
  }, [loadAll]);

  const fetchExchangeRates = useCallback(async () => {
    const dto = await wpApi.fetchRates();
    setSettings(fromApiSettings(dto));
    return { source: dto.rate_source };
  }, []);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const dto = await wpApi.createClient(toApiClientPayload(client));
    const mapped = fromApiClient(dto);
    setClients((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  }, []);

  const updateClient = useCallback(async (id: string, patch: Partial<Omit<Client, 'id'>>) => {
    const dto = await wpApi.updateClient(id, toApiClientPayload(patch as Omit<Client, 'id'>));
    const mapped = fromApiClient(dto);
    setClients((prev) => prev.map((c) => (c.id === id ? mapped : c)).sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await wpApi.deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethod, 'id'>) => {
    const dto = await wpApi.createPaymentMethod(toApiPaymentMethodPayload(method));
    const mapped = fromApiPaymentMethod(dto);
    setPaymentMethods((prev) => [...prev, mapped].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)));
    return mapped;
  }, []);

  const updatePaymentMethod = useCallback(async (id: string, patch: Partial<Omit<PaymentMethod, 'id'>>) => {
    const dto = await wpApi.updatePaymentMethod(id, toApiPaymentMethodPayload(patch as Omit<PaymentMethod, 'id'>));
    const mapped = fromApiPaymentMethod(dto);
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === id ? mapped : m)).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    );
    return mapped;
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    await wpApi.deletePaymentMethod(id);
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const dto = await wpApi.createInvoice(toApiInvoicePayload(invoice));
    const mapped = fromApiInvoice(dto);
    setInvoices((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const updateInvoice = useCallback(async (id: string, patch: Partial<Omit<Invoice, 'id'>>) => {
    const dto = await wpApi.updateInvoice(id, toApiInvoicePayload(patch as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>));
    const mapped = fromApiInvoice(dto);
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
    return mapped;
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    await wpApi.deleteInvoice(id);
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const dto = await wpApi.updateSettings(toApiSettingsPayload(patch));
    setSettings(fromApiSettings(dto));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      loadError,
      syncing,
      clients,
      paymentMethods,
      invoices,
      settings,
      refreshAll,
      fetchExchangeRates,
      addClient,
      updateClient,
      deleteClient,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      updateSettings,
    }),
    [
      loading,
      loadError,
      syncing,
      clients,
      paymentMethods,
      invoices,
      settings,
      refreshAll,
      fetchExchangeRates,
      addClient,
      updateClient,
      deleteClient,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      updateSettings,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
