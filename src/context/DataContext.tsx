import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ApiConfig, wpApi } from '../lib/api/client';
import { clearConnection, loadConnection, saveConnection } from '../lib/api/connectionStore';
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
import { generateId } from '../lib/id';
import { storage } from '../lib/storage';
import { Client, DEFAULT_SETTINGS, Invoice, PaymentMethod, Settings } from '../types';

export interface ConnectionInfo {
  siteUrl: string;
}

interface DataContextValue {
  loading: boolean;
  clients: Client[];
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  settings: Settings;

  connection: ConnectionInfo | null;
  connecting: boolean;
  syncing: boolean;
  syncError: string | null;
  connectToApi: (siteUrl: string, apiKey: string) => Promise<void>;
  disconnectFromApi: () => Promise<void>;
  refreshAll: () => Promise<void>;

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
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const apiConfigRef = useRef<ApiConfig | null>(null);

  const loadFromApi = useCallback(async (config: ApiConfig) => {
    const [clientsDto, methodsDto, invoicesDto, settingsDto] = await Promise.all([
      wpApi.getClients(config),
      wpApi.getPaymentMethods(config),
      wpApi.getInvoices(config),
      wpApi.getSettings(config),
    ]);
    setClients(clientsDto.map(fromApiClient).sort((a, b) => a.name.localeCompare(b.name)));
    setPaymentMethods(
      methodsDto.map(fromApiPaymentMethod).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    );
    setInvoices(invoicesDto.map(fromApiInvoice));
    setSettings(fromApiSettings(settingsDto));
  }, []);

  const loadFromLocalStorage = useCallback(async () => {
    const [c, p, i, s] = await Promise.all([
      storage.loadClients(),
      storage.loadPaymentMethods(),
      storage.loadInvoices(),
      storage.loadSettings(),
    ]);
    setClients(c);
    setPaymentMethods(p);
    setInvoices(i);
    setSettings({ ...DEFAULT_SETTINGS, ...s });
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadConnection();
      if (saved) {
        apiConfigRef.current = saved;
        setConnection({ siteUrl: saved.siteUrl });
        try {
          await loadFromApi(saved);
        } catch (err: any) {
          setSyncError(err?.message ?? 'Could not reach the site.');
        }
      } else {
        await loadFromLocalStorage();
      }
      setLoading(false);
    })();
  }, [loadFromApi, loadFromLocalStorage]);

  const connectToApi = useCallback(
    async (siteUrl: string, apiKey: string) => {
      const config: ApiConfig = { siteUrl: siteUrl.trim(), apiKey: apiKey.trim() };
      setConnecting(true);
      setSyncError(null);
      try {
        await wpApi.testConnection(config);
        await saveConnection(config);
        apiConfigRef.current = config;
        setConnection({ siteUrl: config.siteUrl });
        await loadFromApi(config);
      } finally {
        setConnecting(false);
      }
    },
    [loadFromApi],
  );

  const disconnectFromApi = useCallback(async () => {
    await clearConnection();
    apiConfigRef.current = null;
    setConnection(null);
    setSyncError(null);
    await loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const refreshAll = useCallback(async () => {
    if (!apiConfigRef.current) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await loadFromApi(apiConfigRef.current);
    } catch (err: any) {
      setSyncError(err?.message ?? 'Could not refresh from the site.');
    } finally {
      setSyncing(false);
    }
  }, [loadFromApi]);

  const addClient = useCallback(async (client: Omit<Client, 'id'>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.createClient(apiConfigRef.current, toApiClientPayload(client));
      const mapped = fromApiClient(dto);
      setClients((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
      return mapped;
    }
    const newClient: Client = { ...client, id: generateId() };
    setClients((prev) => {
      const next = [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
      storage.saveClients(next);
      return next;
    });
    return newClient;
  }, []);

  const updateClient = useCallback(async (id: string, patch: Partial<Omit<Client, 'id'>>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.updateClient(apiConfigRef.current, id, toApiClientPayload(patch as Omit<Client, 'id'>));
      const mapped = fromApiClient(dto);
      setClients((prev) => prev.map((c) => (c.id === id ? mapped : c)).sort((a, b) => a.name.localeCompare(b.name)));
      return mapped;
    }
    let updated: Client | undefined;
    setClients((prev) => {
      const next = prev
        .map((c) => {
          if (c.id !== id) return c;
          updated = { ...c, ...patch };
          return updated;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      storage.saveClients(next);
      return next;
    });
    return updated as Client;
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    if (apiConfigRef.current) {
      await wpApi.deleteClient(apiConfigRef.current, id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      storage.saveClients(next);
      return next;
    });
  }, []);

  const addPaymentMethod = useCallback(async (method: Omit<PaymentMethod, 'id'>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.createPaymentMethod(apiConfigRef.current, toApiPaymentMethodPayload(method));
      const mapped = fromApiPaymentMethod(dto);
      setPaymentMethods((prev) =>
        [...prev, mapped].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
      );
      return mapped;
    }
    const newMethod: PaymentMethod = { ...method, id: generateId() };
    setPaymentMethods((prev) => {
      const next = [...prev, newMethod].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      storage.savePaymentMethods(next);
      return next;
    });
    return newMethod;
  }, []);

  const updatePaymentMethod = useCallback(async (id: string, patch: Partial<Omit<PaymentMethod, 'id'>>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.updatePaymentMethod(
        apiConfigRef.current,
        id,
        toApiPaymentMethodPayload(patch as Omit<PaymentMethod, 'id'>),
      );
      const mapped = fromApiPaymentMethod(dto);
      setPaymentMethods((prev) =>
        prev.map((m) => (m.id === id ? mapped : m)).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
      );
      return mapped;
    }
    let updated: PaymentMethod | undefined;
    setPaymentMethods((prev) => {
      const next = prev
        .map((m) => {
          if (m.id !== id) return m;
          updated = { ...m, ...patch };
          return updated;
        })
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      storage.savePaymentMethods(next);
      return next;
    });
    return updated as PaymentMethod;
  }, []);

  const deletePaymentMethod = useCallback(async (id: string) => {
    if (apiConfigRef.current) {
      await wpApi.deletePaymentMethod(apiConfigRef.current, id);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    setPaymentMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      storage.savePaymentMethods(next);
      return next;
    });
  }, []);

  const addInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.createInvoice(apiConfigRef.current, toApiInvoicePayload(invoice));
      const mapped = fromApiInvoice(dto);
      setInvoices((prev) => [mapped, ...prev]);
      return mapped;
    }
    const now = new Date().toISOString();
    const newInvoice: Invoice = { ...invoice, id: generateId(), createdAt: now, updatedAt: now };
    setInvoices((prev) => {
      const next = [newInvoice, ...prev];
      storage.saveInvoices(next);
      return next;
    });
    return newInvoice;
  }, []);

  const updateInvoice = useCallback(async (id: string, patch: Partial<Omit<Invoice, 'id'>>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.updateInvoice(
        apiConfigRef.current,
        id,
        toApiInvoicePayload(patch as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>),
      );
      const mapped = fromApiInvoice(dto);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));
      return mapped;
    }
    let updated: Invoice | undefined;
    setInvoices((prev) => {
      const next = prev.map((inv) => {
        if (inv.id !== id) return inv;
        updated = { ...inv, ...patch, updatedAt: new Date().toISOString() };
        return updated;
      });
      storage.saveInvoices(next);
      return next;
    });
    return updated as Invoice;
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    if (apiConfigRef.current) {
      await wpApi.deleteInvoice(apiConfigRef.current, id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      return;
    }
    setInvoices((prev) => {
      const next = prev.filter((inv) => inv.id !== id);
      storage.saveInvoices(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    if (apiConfigRef.current) {
      const dto = await wpApi.updateSettings(apiConfigRef.current, toApiSettingsPayload(patch));
      setSettings(fromApiSettings(dto));
      return;
    }
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      clients,
      paymentMethods,
      invoices,
      settings,
      connection,
      connecting,
      syncing,
      syncError,
      connectToApi,
      disconnectFromApi,
      refreshAll,
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
      clients,
      paymentMethods,
      invoices,
      settings,
      connection,
      connecting,
      syncing,
      syncError,
      connectToApi,
      disconnectFromApi,
      refreshAll,
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
