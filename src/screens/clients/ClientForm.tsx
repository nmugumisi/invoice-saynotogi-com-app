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

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Client' : 'New Client' });
  }, [existing, navigation]);

  const canSave = name.trim().length > 0;

  const onSave = () => {
    const payload = { name: name.trim(), address: address.trim(), email: email.trim(), phone: phone.trim() };
    if (existing) {
      updateClient(existing.id, payload);
    } else {
      addClient(payload);
    }
    navigation.goBack();
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete client?', `Remove "${existing.name}" from your contacts.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteClient(existing.id);
          navigation.goBack();
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
        <PrimaryButton title="Save Client" onPress={onSave} disabled={!canSave} />
      </View>
      {existing ? (
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton title="Delete Client" onPress={onDelete} variant="danger" />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
});
