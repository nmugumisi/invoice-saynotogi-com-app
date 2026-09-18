import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

function TabIcon({
  name,
  color,
  size,
}: {
  name: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  size: number;
}) {
  return <MaterialIcons name={name} color={color} size={size} />;
}

// react-navigation's own default bottom-tab height (uikit variant) before
// the safe-area bottom inset is added.
const DEFAULT_TAB_BAR_HEIGHT = 49;
const EXTRA_TAB_BAR_HEIGHT = 4;

export default function RootNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          height: DEFAULT_TAB_BAR_HEIGHT + insets.bottom + EXTRA_TAB_BAR_HEIGHT,
          paddingBottom: insets.bottom + EXTRA_TAB_BAR_HEIGHT,
        },
      }}
    >
      <Tab.Screen
        name="InvoicesTab"
        component={InvoicesStackNavigator}
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, size }) => <TabIcon name="receipt-long" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ClientsStackNavigator}
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <TabIcon name="people" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PaymentMethodsTab"
        component={PaymentMethodsStackNavigator}
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <TabIcon name="payments" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
