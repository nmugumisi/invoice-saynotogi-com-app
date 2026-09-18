import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Field, PrimaryButton, SectionTitle } from '../../components/ui';
import { PickerModal } from '../../components/PickerModal';
import { useData } from '../../context/DataContext';
import { generateId } from '../../lib/id';
import { nextInvoiceNumber } from '../../lib/invoiceNumber';
import { fmtMoney, formatDate, todayIso } from '../../lib/money';
import { InvoicesStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { Invoice, InvoiceItem, invoiceTotal } from '../../types';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'InvoiceForm'>;

function emptyItem(): InvoiceItem {
  return { id: generateId(), desc: '', description: '', qty: 1, price: 0 };
}

export default function InvoiceFormScreen({ route, navigation }: Props) {
  const { invoiceId } = route.params ?? {};
  const { invoices, clients, paymentMethods, settings, addInvoice, updateInvoice, deleteInvoice } =
    useData();
  const existing = invoices.find((i) => i.id === invoiceId);

  const [number, setNumber] = useState(existing?.number ?? nextInvoiceNumber(invoices, settings));
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? todayIso());
  const [clientId, setClientId] = useState<string | null>(existing?.clientId ?? null);
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items?.length ? existing.items : [emptyItem()]);
  const [notes, setNotes] = useState(existing?.notes ?? settings.defaultNotes);
  const [paymentMethodIds, setPaymentMethodIds] = useState<string[]>(existing?.paymentMethodIds ?? []);
  const [amountPaid, setAmountPaid] = useState(String(existing?.amountPaid ?? 0));
  const [showZar, setShowZar] = useState(existing?.showZar ?? false);
  const [showBwp, setShowBwp] = useState(existing?.showBwp ?? false);

  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [datePickerFor, setDatePickerFor] = useState<'date' | 'dueDate' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? `Edit ${existing.number}` : 'New Invoice' });
  }, [existing, navigation]);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const total = useMemo(() => invoiceTotal({ items }), [items]);
  const paidNum = parseFloat(amountPaid) || 0;
  const due = Math.max(0, total - paidNum);

  const zarPreview =
    showZar && settings.zarRate ? Math.round((total * settings.zarRate) / 10) * 10 : null;
  const bwpPreview =
    showBwp && settings.bwpRate ? Math.round((total * settings.bwpRate) / 10) * 10 : null;

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const togglePaymentMethod = (id: string) => {
    setPaymentMethodIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSave = number.trim().length > 0 && !!clientId;

  const onSave = async () => {
    if (!clientId || !client) {
      Alert.alert('Select a client', 'Choose who this invoice is billed to.');
      return;
    }

    const cleanedItems = items.filter(
      (it) => it.desc.trim() || it.description.trim() || it.qty !== 0 || it.price !== 0,
    );

    const payload: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      number: number.trim(),
      date,
      dueDate,
      clientId,
      billToName: client.name,
      billToAddress: client.address,
      billToEmail: client.email,
      billToPhone: client.phone,
      items: cleanedItems.length ? cleanedItems : [emptyItem()],
      notes: notes.trim(),
      paymentMethodIds,
      amountPaid: paidNum,
      showZar,
      showBwp,
      zarTotal: showZar && settings.zarRate ? Math.round((total * settings.zarRate) / 10) * 10 : null,
      zarRateUsed: showZar && settings.zarRate ? settings.zarRate : null,
      bwpTotal: showBwp && settings.bwpRate ? Math.round((total * settings.bwpRate) / 10) * 10 : null,
      bwpRateUsed: showBwp && settings.bwpRate ? settings.bwpRate : null,
    };

    setSaving(true);
    try {
      if (existing) {
        await updateInvoice(existing.id, payload);
        navigation.replace('InvoicePreview', { invoiceId: existing.id });
      } else {
        const created = await addInvoice(payload);
        navigation.replace('InvoicePreview', { invoiceId: created.id });
      }
    } catch (err: any) {
      Alert.alert('Could not save invoice', err?.message ?? 'Unknown error.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete invoice?', `Remove invoice ${existing.number}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteInvoice(existing.id);
            navigation.popToTop();
          } catch (err: any) {
            Alert.alert('Could not delete invoice', err?.message ?? 'Unknown error.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <SectionTitle>Invoice Details</SectionTitle>
        <Field label="Invoice No#" value={number} onChangeText={setNumber} />

        <Text style={styles.label}>Invoice Date</Text>
        <Pressable style={styles.dateInput} onPress={() => setDatePickerFor('date')}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </Pressable>

        <Text style={styles.label}>Due Date</Text>
        <Pressable style={styles.dateInput} onPress={() => setDatePickerFor('dueDate')}>
          <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
        </Pressable>

        <Field
          label="Amount Paid"
          value={amountPaid}
          onChangeText={setAmountPaid}
          keyboardType="decimal-pad"
          hint="Leave as 0 until payment is received."
        />

        <SectionTitle>Bill To</SectionTitle>
        <Pressable style={styles.clientPicker} onPress={() => setClientPickerOpen(true)}>
          {client ? (
            <View>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.address ? <Text style={styles.clientMeta}>{client.address}</Text> : null}
              {client.email ? <Text style={styles.clientMeta}>{client.email}</Text> : null}
              {client.phone ? <Text style={styles.clientMeta}>Phone: {client.phone}</Text> : null}
            </View>
          ) : (
            <Text style={styles.clientPlaceholder}>Tap to select a client</Text>
          )}
        </Pressable>
        {clients.length === 0 ? (
          <Text style={styles.hintText}>
            No clients yet — add one from the Clients tab first.
          </Text>
        ) : null}

        <SectionTitle>Items</SectionTitle>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIndex}>#{index + 1}</Text>
              {items.length > 1 ? (
                <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                  <Text style={styles.itemRemove}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <TextInput
              style={styles.itemInput}
              placeholder="Item name, e.g. IT Support"
              placeholderTextColor="#9AA5A0"
              value={item.desc}
              onChangeText={(v) => updateItem(item.id, { desc: v })}
            />
            <TextInput
              style={styles.itemInput}
              placeholder="Description (optional)"
              placeholderTextColor="#9AA5A0"
              value={item.description}
              onChangeText={(v) => updateItem(item.id, { description: v })}
            />
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Qty/Hrs</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  keyboardType="decimal-pad"
                  value={String(item.qty)}
                  onChangeText={(v) => updateItem(item.id, { qty: parseFloat(v) || 0 })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Price</Text>
                <TextInput
                  style={styles.itemInputSmall}
                  keyboardType="decimal-pad"
                  value={String(item.price)}
                  onChangeText={(v) => updateItem(item.id, { price: parseFloat(v) || 0 })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>Amount</Text>
                <Text style={styles.itemAmount}>
                  {settings.currencySymbol}
                  {fmtMoney(item.qty * item.price)}
                </Text>
              </View>
            </View>
          </View>
        ))}
        <PrimaryButton title="+ Add Item" onPress={addItem} variant="secondary" />

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {settings.currencySymbol}
              {fmtMoney(total)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, styles.totalsStrong]}>TOTAL</Text>
            <Text style={[styles.totalsValue, styles.totalsStrong]}>
              {settings.currencySymbol}
              {fmtMoney(total)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, styles.totalsStrong]}>Amount Due</Text>
            <Text style={[styles.totalsValue, styles.totalsStrong, { color: colors.primary }]}>
              {settings.currencySymbol}
              {fmtMoney(due)}
            </Text>
          </View>
        </View>

        <SectionTitle>Notes &amp; Payment</SectionTitle>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Show total in South African Rand</Text>
            {settings.zarRate ? (
              zarPreview != null ? (
                <Text style={styles.switchHint}>will save as R{zarPreview}</Text>
              ) : null
            ) : (
              <Text style={styles.switchHint}>Set the ZAR rate in Settings to enable this.</Text>
            )}
          </View>
          <Switch
            value={showZar}
            onValueChange={setShowZar}
            disabled={!settings.zarRate}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Show total in Botswana Pula</Text>
            {settings.bwpRate ? (
              bwpPreview != null ? (
                <Text style={styles.switchHint}>will save as P{bwpPreview}</Text>
              ) : null
            ) : (
              <Text style={styles.switchHint}>Set the BWP rate in Settings to enable this.</Text>
            )}
          </View>
          <Switch
            value={showBwp}
            onValueChange={setShowBwp}
            disabled={!settings.bwpRate}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Field label="Notes to Customer" value={notes} onChangeText={setNotes} multiline />

        <Text style={styles.label}>Payment Details</Text>
        <Pressable style={styles.clientPicker} onPress={() => setMethodPickerOpen(true)}>
          <Text style={paymentMethodIds.length ? styles.clientName : styles.clientPlaceholder}>
            {paymentMethodIds.length
              ? `${paymentMethodIds.length} payment method${paymentMethodIds.length > 1 ? 's' : ''} selected`
              : 'Select payment methods to show'}
          </Text>
        </Pressable>

        <View style={{ marginTop: spacing.lg }}>
          <PrimaryButton title="Save Invoice" onPress={onSave} disabled={!canSave || saving} loading={saving} />
        </View>
        {existing ? (
          <View style={{ marginTop: spacing.sm }}>
            <PrimaryButton title="Delete Invoice" onPress={onDelete} variant="danger" loading={deleting} />
          </View>
        ) : null}
      </ScrollView>

      <PickerModal
        visible={clientPickerOpen}
        title="Select Client"
        options={clients.map((c) => ({ id: c.id, label: c.name, sublabel: c.email || c.phone }))}
        selectedIds={clientId ? [clientId] : []}
        onClose={() => setClientPickerOpen(false)}
        onSelect={(id) => setClientId(id)}
        emptyLabel="No clients yet — add one from the Clients tab."
      />

      <PickerModal
        visible={methodPickerOpen}
        title="Payment Methods"
        multi
        options={paymentMethods.map((m) => ({ id: m.id, label: m.title, sublabel: m.content }))}
        selectedIds={paymentMethodIds}
        onClose={() => setMethodPickerOpen(false)}
        onSelect={togglePaymentMethod}
        emptyLabel="No payment methods yet — add one from the Payment Methods tab."
      />

      {datePickerFor ? (
        <DateTimePicker
          value={new Date(`${datePickerFor === 'date' ? date : dueDate}T00:00:00`)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selected) => {
            const field = datePickerFor;
            setDatePickerFor(null);
            if (event.type === 'dismissed' || !selected) return;
            const iso = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(
              selected.getDate(),
            ).padStart(2, '0')}`;
            if (field === 'date') setDate(iso);
            else setDueDate(iso);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  hintText: { fontSize: 12, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md },
  dateInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  dateText: { fontSize: 15, color: colors.text },
  clientPicker: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  clientName: { fontSize: 15, fontWeight: '700', color: colors.text },
  clientMeta: { fontSize: 12.5, color: colors.textMuted, marginTop: 2 },
  clientPlaceholder: { fontSize: 14, color: colors.textMuted },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  itemIndex: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  itemRemove: { fontSize: 12, fontWeight: '700', color: colors.danger },
  itemInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  itemRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  smallLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  itemInputSmall: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  itemAmount: { fontSize: 14, fontWeight: '700', color: colors.text, paddingVertical: 8 },
  totalsBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalsLabel: { fontSize: 13, color: colors.text },
  totalsValue: { fontSize: 13, color: colors.text },
  totalsStrong: { fontWeight: '700', fontSize: 15 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  switchLabel: { fontSize: 13.5, color: colors.text, fontWeight: '600' },
  switchHint: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
});
