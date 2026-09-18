import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

export function PickerModal({
  visible,
  title,
  options,
  selectedIds,
  multi,
  onClose,
  onSelect,
  emptyLabel,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedIds: string[];
  multi?: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>Done</Text>
            </Pressable>
          </View>
          {options.length === 0 ? (
            <Text style={styles.empty}>{emptyLabel ?? 'Nothing here yet.'}</Text>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 420 }}
              renderItem={({ item }) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <Pressable
                    style={styles.row}
                    onPress={() => {
                      onSelect(item.id);
                      if (!multi) onClose();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {item.sublabel ? <Text style={styles.rowSublabel}>{item.sublabel}</Text> : null}
                    </View>
                    <View style={[styles.checkbox, selected && styles.checkboxOn]}>
                      {selected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  close: { fontSize: 15, fontWeight: '700', color: colors.primary },
  empty: { color: colors.textMuted, paddingVertical: spacing.lg, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '600' },
  rowSublabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
