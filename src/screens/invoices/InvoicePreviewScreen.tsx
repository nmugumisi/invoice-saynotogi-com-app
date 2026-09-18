import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, StatusBadge } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { buildInvoiceHtml } from '../../lib/invoiceHtml';
import { fmtMoney, formatDate } from '../../lib/money';
import { InvoicesStackParamList } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { invoiceStatus, invoiceTotal } from '../../types';

type Props = NativeStackScreenProps<InvoicesStackParamList, 'InvoicePreview'>;

export default function InvoicePreviewScreen({ route, navigation }: Props) {
  const { invoiceId } = route.params;
  const { invoices, settings, paymentMethods } = useData();
  const [busy, setBusy] = useState(false);

  const invoice = invoices.find((i) => i.id === invoiceId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: invoice ? invoice.number : 'Invoice' });
  }, [invoice, navigation]);

  if (!invoice) {
    return (
      <View style={styles.missing}>
        <Text>This invoice no longer exists.</Text>
      </View>
    );
  }

  const total = invoiceTotal(invoice);
  const due = Math.max(0, total - invoice.amountPaid);
  const status = invoiceStatus(invoice);
  const symbol = settings.currencySymbol || 'US$';
  const selectedMethods = paymentMethods.filter((m) => invoice.paymentMethodIds.includes(m.id));

  const onShare = async () => {
    setBusy(true);
    try {
      const html = buildInvoiceHtml(invoice, settings, paymentMethods);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoice.number}`,
        });
      } else {
        Alert.alert('Sharing unavailable', 'This device cannot share files.');
      }
    } catch (err: any) {
      Alert.alert('Could not create PDF', err?.message ?? 'Unknown error.');
    } finally {
      setBusy(false);
    }
  };

  const onPrint = async () => {
    setBusy(true);
    try {
      const html = buildInvoiceHtml(invoice, settings, paymentMethods);
      await Print.printAsync({ html });
    } catch (err: any) {
      Alert.alert('Could not print', err?.message ?? 'Unknown error.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            {settings.logoUri ? (
              <Image source={{ uri: settings.logoUri }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View />
            )}
            <View style={styles.headerFrom}>
              <Text style={styles.docTitle}>INVOICE</Text>
              {settings.companyName ? <Text style={styles.companyName}>{settings.companyName}</Text> : null}
              {settings.companyAddress ? (
                <Text style={styles.companyMeta}>{settings.companyAddress}</Text>
              ) : null}
              {settings.companyPhone || settings.companyEmail ? (
                <Text style={styles.companyMeta}>
                  {[settings.companyPhone && `Phone: ${settings.companyPhone}`, settings.companyEmail]
                    .filter(Boolean)
                    .join('; ')}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.metaBand}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No#</Text> : {invoice.number}
              </Text>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice Date</Text> : {formatDate(invoice.date)}
              </Text>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Due Date</Text> : {formatDate(invoice.dueDate)}
              </Text>
            </View>
            <View style={styles.metaDue}>
              {status !== 'unpaid' ? (
                <View style={{ marginBottom: 6 }}>
                  <StatusBadge status={status} />
                </View>
              ) : null}
              <Text style={styles.dueFigure}>
                {symbol}
                {fmtMoney(due)}
              </Text>
              <Text style={styles.dueCaption}>AMOUNT DUE</Text>
            </View>
          </View>

          <Text style={styles.label}>BILL TO</Text>
          <Text style={styles.billName}>{invoice.billToName}</Text>
          {invoice.billToAddress ? <Text style={styles.billMeta}>{invoice.billToAddress}</Text> : null}
          {invoice.billToEmail ? <Text style={styles.billMeta}>{invoice.billToEmail}</Text> : null}
          {invoice.billToPhone ? <Text style={styles.billMeta}>Phone: {invoice.billToPhone}</Text> : null}

          <View style={styles.itemsTable}>
            <View style={[styles.itemsRow, styles.itemsHeaderRow]}>
              <Text style={[styles.itemsCellNum, styles.itemsHeaderText]}>#</Text>
              <Text style={[styles.itemsCellDesc, styles.itemsHeaderText]}>ITEM</Text>
              <Text style={[styles.itemsCellNumeric, styles.itemsHeaderText]}>QTY</Text>
              <Text style={[styles.itemsCellNumeric, styles.itemsHeaderText]}>AMOUNT</Text>
            </View>
            {invoice.items.map((item, i) => (
              <View key={item.id} style={styles.itemsRow}>
                <Text style={styles.itemsCellNum}>{i + 1}</Text>
                <View style={styles.itemsCellDesc}>
                  <Text style={styles.itemsDescText}>{item.desc}</Text>
                  {item.description ? (
                    <Text style={styles.itemsSubDescText}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={styles.itemsCellNumeric}>{item.qty}</Text>
                <Text style={styles.itemsCellNumeric}>
                  {symbol}
                  {fmtMoney(item.qty * item.price)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {symbol}
                {fmtMoney(total)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryStrongRow]}>
              <Text style={[styles.summaryLabel, styles.summaryStrong]}>TOTAL</Text>
              <Text style={[styles.summaryValue, styles.summaryStrong]}>
                {symbol}
                {fmtMoney(total)} {settings.currencyCode}
              </Text>
            </View>
            {invoice.amountPaid > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount paid</Text>
                <Text style={styles.summaryValue}>
                  {symbol}
                  {fmtMoney(invoice.amountPaid)}
                </Text>
              </View>
            ) : null}
            <View style={[styles.summaryRow, styles.summaryStrongRow]}>
              <Text style={[styles.summaryLabel, styles.summaryStrong, { color: colors.primaryDark }]}>
                AMOUNT DUE
              </Text>
              <Text style={[styles.summaryValue, styles.summaryStrong, { color: colors.primaryDark }]}>
                {symbol}
                {fmtMoney(due)} {settings.currencyCode}
              </Text>
            </View>
          </View>

          {invoice.notes || selectedMethods.length || invoice.showZar || invoice.showBwp ? (
            <View style={styles.notesBox}>
              <Text style={styles.label}>NOTES TO CUSTOMER</Text>
              {invoice.showZar && invoice.zarTotal != null ? (
                <Text style={styles.notesText}>
                  Total in South African Rand: R{Math.round(invoice.zarTotal)}
                </Text>
              ) : null}
              {invoice.showBwp && invoice.bwpTotal != null ? (
                <Text style={styles.notesText}>
                  Total in Botswana Pula: P{Math.round(invoice.bwpTotal)}
                </Text>
              ) : null}
              {invoice.notes ? <Text style={styles.notesText}>{invoice.notes}</Text> : null}
              {selectedMethods.length ? (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={styles.paymentHeading}>Payment details</Text>
                  {selectedMethods.map((m) => (
                    <View key={m.id} style={{ marginTop: spacing.xs }}>
                      <Text style={styles.paymentTitle}>{m.title}</Text>
                      {m.content ? <Text style={styles.notesText}>{m.content}</Text> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title="Edit"
            onPress={() => navigation.navigate('InvoiceForm', { invoiceId: invoice.id })}
            variant="secondary"
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Print" onPress={onPrint} loading={busy} variant="secondary" />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Share PDF" onPress={onShare} loading={busy} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, gap: spacing.md },
  logo: { width: 90, height: 60 },
  headerFrom: { flex: 1, alignItems: 'flex-end' },
  docTitle: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 0.5 },
  companyName: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
  companyMeta: { fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  metaBand: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  metaRow: { fontSize: 12.5, color: colors.text, marginBottom: 2 },
  metaLabel: { fontWeight: '700' },
  metaDue: { alignItems: 'flex-end' },
  dueFigure: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 2 },
  dueCaption: { fontSize: 10.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  label: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3, marginBottom: 4 },
  billName: { fontSize: 14, fontWeight: '700', color: colors.text },
  billMeta: { fontSize: 12.5, color: colors.text },
  itemsTable: { marginTop: spacing.md, marginBottom: spacing.sm },
  itemsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  itemsHeaderRow: { borderBottomWidth: 1.5, borderBottomColor: colors.primary },
  itemsHeaderText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  itemsCellNum: { width: 22, fontSize: 12.5, color: colors.text },
  itemsCellDesc: { flex: 1 },
  itemsDescText: { fontSize: 12.5, color: colors.text, fontWeight: '600' },
  itemsSubDescText: { fontSize: 11.5, color: colors.textMuted },
  itemsCellNumeric: { width: 70, fontSize: 12.5, color: colors.text, textAlign: 'right' },
  summaryBox: { marginTop: spacing.sm, alignSelf: 'flex-end', minWidth: 220 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryStrongRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4, paddingTop: 8 },
  summaryLabel: { fontSize: 12.5, color: colors.text },
  summaryValue: { fontSize: 12.5, color: colors.text },
  summaryStrong: { fontWeight: '700', fontSize: 14 },
  notesBox: { marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  notesText: { fontSize: 12.5, color: colors.text, marginBottom: 4 },
  paymentHeading: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  paymentTitle: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
