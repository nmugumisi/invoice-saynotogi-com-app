import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { generateId } from '../lib/id';
import { storage } from '../lib/storage';
import { Client, DEFAULT_SETTINGS, Invoice, PaymentMethod, Settings } from '../types';

interface DataContextValue {
  loading: boolean;
  clients: Client[];
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  settings: Settings;

  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, patch: Partial<Omit<Client, 'id'>>) => void;
  deleteClient: (id: string) => void;

  addPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => PaymentMethod;
  updatePaymentMethod: (id: string, patch: Partial<Omit<PaymentMethod, 'id'>>) => void;
  deletePaymentMethod: (id: string) => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, patch: Partial<Omit<Invoice, 'id'>>) => void;
  deleteInvoice: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
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
      setLoading(false);
    })();
  }, []);

  const addClient = useCallback(
    (client: Omit<Client, 'id'>) => {
      const newClient: Client = { ...client, id: generateId() };
      setClients((prev) => {
        const next = [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name));
        storage.saveClients(next);
        return next;
      });
      return newClient;
    },
    [],
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<Omit<Client, 'id'>>) => {
      setClients((prev) => {
        const next = prev
          .map((c) => (c.id === id ? { ...c, ...patch } : c))
          .sort((a, b) => a.name.localeCompare(b.name));
        storage.saveClients(next);
        return next;
      });
    },
    [],
  );

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      storage.saveClients(next);
      return next;
    });
  }, []);

  const addPaymentMethod = useCallback((method: Omit<PaymentMethod, 'id'>) => {
    const newMethod: PaymentMethod = { ...method, id: generateId() };
    setPaymentMethods((prev) => {
      const next = [...prev, newMethod].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      storage.savePaymentMethods(next);
      return next;
    });
    return newMethod;
  }, []);

  const updatePaymentMethod = useCallback((id: string, patch: Partial<Omit<PaymentMethod, 'id'>>) => {
    setPaymentMethods((prev) => {
      const next = prev
        .map((m) => (m.id === id ? { ...m, ...patch } : m))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      storage.savePaymentMethods(next);
      return next;
    });
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setPaymentMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      storage.savePaymentMethods(next);
      return next;
    });
  }, []);

  const addInvoice = useCallback((invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newInvoice: Invoice = { ...invoice, id: generateId(), createdAt: now, updatedAt: now };
    setInvoices((prev) => {
      const next = [newInvoice, ...prev];
      storage.saveInvoices(next);
      return next;
    });
    return newInvoice;
  }, []);

  const updateInvoice = useCallback((id: string, patch: Partial<Omit<Invoice, 'id'>>) => {
    setInvoices((prev) => {
      const next = prev.map((inv) =>
        inv.id === id ? { ...inv, ...patch, updatedAt: new Date().toISOString() } : inv,
      );
      storage.saveInvoices(next);
      return next;
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => {
      const next = prev.filter((inv) => inv.id !== id);
      storage.saveInvoices(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
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
