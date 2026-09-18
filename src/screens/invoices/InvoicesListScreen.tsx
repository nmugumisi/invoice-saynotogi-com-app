import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, StatusBadge } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { fmtMoney, formatDate } from '../../lib/money';
import { useAutoRefreshOnFocus } from '../../lib/useAutoRefresh';
import { InvoicesStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { invoiceStatus, invoiceTotal } from '../../types';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'InvoicesList'>;

export default function InvoicesListScreen({ navigation }: Props) {
  const { invoices, settings, syncing, refreshAll, loadError } = useData();
  useAutoRefreshOnFocus();

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [invoices],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={sorted.length === 0 ? styles.flexGrow : styles.list}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={refreshAll} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState
            title={loadError ? 'Could not load invoices' : 'No invoices yet'}
            subtitle={loadError ?? 'Create your first invoice with the + button.'}
          />
        }
        renderItem={({ item }) => {
          const total = invoiceTotal(item);
          const status = invoiceStatus(item);
          return (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('InvoicePreview', { invoiceId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.number}>{item.number}</Text>
                <Text style={styles.client}>{item.billToName || 'No client'}</Text>
                <Text style={styles.date}>
                  {formatDate(item.date)} · Due {formatDate(item.dueDate)}
                </Text>
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.total}>
                  {settings.currencySymbol}
                  {fmtMoney(total)}
                </Text>
                <StatusBadge status={status} />
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => navigation.navigate('InvoiceForm', {})}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flexGrow: { flexGrow: 1 },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  number: { fontSize: 15, fontWeight: '700', color: colors.text },
  client: { fontSize: 13.5, color: colors.text, marginTop: 2 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  total: { fontSize: 15, fontWeight: '700', color: colors.text },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 32, marginTop: -2 },
});
