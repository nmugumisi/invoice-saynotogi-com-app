import { NavigatorScreenParams } from '@react-navigation/native';

export type InvoicesStackParamList = {
  InvoicesList: undefined;
  InvoiceForm: { invoiceId?: string };
  InvoicePreview: { invoiceId: string };
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientForm: { clientId?: string };
};

export type PaymentMethodsStackParamList = {
  PaymentMethodsList: undefined;
  PaymentMethodForm: { methodId?: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

export type RootTabParamList = {
  InvoicesTab: NavigatorScreenParams<InvoicesStackParamList>;
  ClientsTab: NavigatorScreenParams<ClientsStackParamList>;
  PaymentMethodsTab: NavigatorScreenParams<PaymentMethodsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};
