import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Field, PrimaryButton } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { PaymentMethodsStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<PaymentMethodsStackParamList, 'PaymentMethodForm'>;

export default function PaymentMethodFormScreen({ route, navigation }: Props) {
  const { methodId } = route.params ?? {};
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useData();
  const existing = paymentMethods.find((m) => m.id === methodId);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [order, setOrder] = useState(String(existing?.order ?? 0));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Payment Method' : 'New Payment Method' });
  }, [existing, navigation]);

  const canSave = title.trim().length > 0;

  const onSave = async () => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      order: parseInt(order, 10) || 0,
    };
    setSaving(true);
    try {
      if (existing) {
        await updatePaymentMethod(existing.id, payload);
      } else {
        await addPaymentMethod(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save payment method', err?.message ?? 'Unknown error.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete payment method?', `Remove "${existing.title}".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePaymentMethod(existing.id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Could not delete payment method', err?.message ?? 'Unknown error.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Bank Transfer (USD)" />
      <Field
        label="Details"
        value={content}
        onChangeText={setContent}
        placeholder="Account name, number, bank, branch, instructions..."
        multiline
        hint="Free-form — written exactly as it should appear on the invoice."
      />
      <Field
        label="Priority"
        value={order}
        onChangeText={setOrder}
        keyboardType="number-pad"
        hint="Lower numbers show first, both here and on the printed invoice."
      />

      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton title="Save Payment Method" onPress={onSave} disabled={!canSave || saving} loading={saving} />
      </View>
      {existing ? (
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton title="Delete Payment Method" onPress={onDelete} variant="danger" loading={deleting} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
});
