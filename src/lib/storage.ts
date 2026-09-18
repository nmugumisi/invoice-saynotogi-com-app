import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, DEFAULT_SETTINGS, Invoice, PaymentMethod, Settings } from '../types';

const KEYS = {
  clients: '@invoices/clients',
  paymentMethods: '@invoices/paymentMethods',
  invoices: '@invoices/invoices',
  settings: '@invoices/settings',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  loadClients: () => readJson<Client[]>(KEYS.clients, []),
  saveClients: (clients: Client[]) => AsyncStorage.setItem(KEYS.clients, JSON.stringify(clients)),

  loadPaymentMethods: () => readJson<PaymentMethod[]>(KEYS.paymentMethods, []),
  savePaymentMethods: (methods: PaymentMethod[]) =>
    AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(methods)),

  loadInvoices: () => readJson<Invoice[]>(KEYS.invoices, []),
  saveInvoices: (invoices: Invoice[]) => AsyncStorage.setItem(KEYS.invoices, JSON.stringify(invoices)),

  loadSettings: () => readJson<Settings>(KEYS.settings, DEFAULT_SETTINGS),
  saveSettings: (settings: Settings) => AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings)),
};
