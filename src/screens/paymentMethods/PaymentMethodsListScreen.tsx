import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { useAutoRefreshOnFocus } from '../../lib/useAutoRefresh';
import { PaymentMethodsStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<PaymentMethodsStackParamList, 'PaymentMethodsList'>;

export default function PaymentMethodsListScreen({ navigation }: Props) {
  const { paymentMethods, connection, syncing, refreshAll } = useData();
  useAutoRefreshOnFocus();

  return (
    <View style={styles.container}>
      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        contentContainerStyle={paymentMethods.length === 0 ? styles.flexGrow : styles.list}
        refreshControl={
          connection ? (
            <RefreshControl refreshing={syncing} onRefresh={refreshAll} colors={[colors.primary]} />
          ) : undefined
        }
        ListEmptyComponent={
          <EmptyState
            title="No payment methods yet"
            subtitle="Add bank transfer, mobile money, or other details to show on invoices."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('PaymentMethodForm', { methodId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title || 'Untitled method'}</Text>
              {item.content ? (
                <Text style={styles.preview} numberOfLines={2}>
                  {item.content}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => navigation.navigate('PaymentMethodForm', {})}>
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
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  preview: { fontSize: 12.5, color: colors.textMuted, marginTop: 4 },
  chevron: { fontSize: 22, color: colors.border },
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
