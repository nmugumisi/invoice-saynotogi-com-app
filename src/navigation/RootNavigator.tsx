import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Text } from 'react-native';
import ClientFormScreen from '../screens/clients/ClientForm';
import ClientsListScreen from '../screens/clients/ClientsListScreen';
import InvoiceFormScreen from '../screens/invoices/InvoiceForm';
import InvoicePreviewScreen from '../screens/invoices/InvoicePreviewScreen';
import InvoicesListScreen from '../screens/invoices/InvoicesListScreen';
import PaymentMethodFormScreen from '../screens/paymentMethods/PaymentMethodForm';
import PaymentMethodsListScreen from '../screens/paymentMethods/PaymentMethodsListScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { colors } from '../theme';
import {
  ClientsStackParamList,
  InvoicesStackParamList,
  PaymentMethodsStackParamList,
  RootTabParamList,
  SettingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const InvoicesStack = createNativeStackNavigator<InvoicesStackParamList>();
const ClientsStack = createNativeStackNavigator<ClientsStackParamList>();
const PaymentMethodsStack = createNativeStackNavigator<PaymentMethodsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const },
  headerShadowVisible: false,
};

function InvoicesStackNavigator() {
  return (
    <InvoicesStack.Navigator screenOptions={stackScreenOptions}>
      <InvoicesStack.Screen
        name="InvoicesList"
        component={InvoicesListScreen}
        options={{ title: 'Invoices' }}
      />
      <InvoicesStack.Screen name="InvoiceForm" component={InvoiceFormScreen} options={{ title: 'Invoice' }} />
      <InvoicesStack.Screen
        name="InvoicePreview"
        component={InvoicePreviewScreen}
        options={{ title: 'Invoice' }}
      />
    </InvoicesStack.Navigator>
  );
}

function ClientsStackNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={stackScreenOptions}>
      <ClientsStack.Screen name="ClientsList" component={ClientsListScreen} options={{ title: 'Clients' }} />
      <ClientsStack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: 'Client' }} />
    </ClientsStack.Navigator>
  );
}

function PaymentMethodsStackNavigator() {
  return (
    <PaymentMethodsStack.Navigator screenOptions={stackScreenOptions}>
      <PaymentMethodsStack.Screen
        name="PaymentMethodsList"
        component={PaymentMethodsListScreen}
        options={{ title: 'Payment Methods' }}
      />
      <PaymentMethodsStack.Screen
        name="PaymentMethodForm"
        component={PaymentMethodFormScreen}
        options={{ title: 'Payment Method' }}
      />
    </PaymentMethodsStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackScreenOptions}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
    </SettingsStack.Navigator>
  );
}

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="InvoicesTab"
        component={InvoicesStackNavigator}
        options={{
          title: 'Invoices',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🧾" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ClientsStackNavigator}
        options={{
          title: 'Clients',
          tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PaymentMethodsTab"
        component={PaymentMethodsStackNavigator}
        options={{
          title: 'Payments',
          tabBarIcon: ({ focused }) => <TabIcon symbol="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
