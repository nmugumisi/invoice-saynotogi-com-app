import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { ClientsStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<ClientsStackParamList, 'ClientsList'>;

export default function ClientsListScreen({ navigation }: Props) {
  const { clients } = useData();

  return (
    <View style={styles.container}>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={clients.length === 0 ? styles.flexGrow : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No clients yet"
            subtitle="Add a client to reuse their details on invoices."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ClientForm', { clientId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name || 'Unnamed client'}</Text>
              {item.email ? <Text style={styles.meta}>{item.email}</Text> : null}
              {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ClientForm', {})}
      >
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
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
