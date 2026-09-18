import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Field, PrimaryButton } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { ClientsStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';

type Props = NativeStackScreenProps<ClientsStackParamList, 'ClientForm'>;

export default function ClientFormScreen({ route, navigation }: Props) {
  const { clientId } = route.params ?? {};
  const { clients, addClient, updateClient, deleteClient } = useData();
  const existing = clients.find((c) => c.id === clientId);

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Client' : 'New Client' });
  }, [existing, navigation]);

  const canSave = name.trim().length > 0;

  const onSave = async () => {
    const payload = { name: name.trim(), address: address.trim(), email: email.trim(), phone: phone.trim() };
    setSaving(true);
    try {
      if (existing) {
        await updateClient(existing.id, payload);
      } else {
        await addClient(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save client', err?.message ?? 'Unknown error.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete client?', `Remove "${existing.name}" from your contacts.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteClient(existing.id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Could not delete client', err?.message ?? 'Unknown error.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="Client name" value={name} onChangeText={setName} placeholder="e.g. Acme Trading" />
      <Field
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Street, city, country"
        multiline
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="client@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+263 ..." keyboardType="phone-pad" />

      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton title="Save Client" onPress={onSave} disabled={!canSave || saving} loading={saving} />
      </View>
      {existing ? (
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton title="Delete Client" onPress={onDelete} variant="danger" loading={deleting} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
});
