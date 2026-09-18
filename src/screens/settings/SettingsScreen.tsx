import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, SectionTitle } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { colors, radius, spacing } from '../../theme';
import { Settings } from '../../types';

export default function SettingsScreen() {
  const { settings, updateSettings, fetchExchangeRates } = useData();

  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateStatus, setRateStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<Settings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const draftPatch = (patch: Partial<Settings>) => setDraft((prev) => ({ ...prev, ...patch }));

  const onFetchRates = async () => {
    setFetchingRates(true);
    setRateStatus(null);
    try {
      const { source } = await fetchExchangeRates();
      setRateStatus(`Updated from ${source}.`);
    } catch (err: any) {
      setRateStatus(err?.message ?? 'Could not fetch rates.');
    } finally {
      setFetchingRates(false);
    }
  };

  const onSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await updateSettings(draft);
    } catch (err: any) {
      Alert.alert('Could not save settings', err?.message ?? 'Unknown error.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionTitle>Business Details</SectionTitle>
      <Text style={styles.blurb}>Shown at the top of every invoice — logo, name, address, contact.</Text>

      <View style={styles.logoRow}>
        <View style={styles.logoPreview}>
          {draft.logoUri ? (
            <Image source={{ uri: draft.logoUri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={styles.logoPlaceholder}>No logo</Text>
          )}
        </View>
        <Text style={[styles.blurb, { flex: 1, marginBottom: 0 }]}>
          Logo can't be changed from the app yet.
        </Text>
      </View>

      <Field label="Company / Your Name" value={draft.companyName} onChangeText={(v) => draftPatch({ companyName: v })} />
      <Field
        label="Address"
        value={draft.companyAddress}
        onChangeText={(v) => draftPatch({ companyAddress: v })}
        multiline
      />
      <Field
        label="Phone"
        value={draft.companyPhone}
        onChangeText={(v) => draftPatch({ companyPhone: v })}
        keyboardType="phone-pad"
      />
      <Field
        label="Email"
        value={draft.companyEmail}
        onChangeText={(v) => draftPatch({ companyEmail: v })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <SectionTitle>Invoice Defaults</SectionTitle>
      <Field
        label="Invoice Number Prefix"
        value={draft.invoicePrefix}
        onChangeText={(v) => draftPatch({ invoicePrefix: v })}
        placeholder="e.g. INV- (leave blank for plain numbers)"
      />
      <Field
        label="Starting Invoice Number"
        value={String(draft.startNumber)}
        onChangeText={(v) => draftPatch({ startNumber: parseInt(v, 10) || 0 })}
        keyboardType="number-pad"
        hint="Used only for the very first invoice — after that, numbering continues automatically."
      />
      <Field label="Currency Symbol" value={draft.currencySymbol} onChangeText={(v) => draftPatch({ currencySymbol: v })} />
      <Field label="Currency Code" value={draft.currencyCode} onChangeText={(v) => draftPatch({ currencyCode: v })} />
      <Field
        label="Default Notes to Customer"
        value={draft.defaultNotes}
        onChangeText={(v) => draftPatch({ defaultNotes: v })}
        multiline
        hint="Pre-fills the notes field on new invoices — editable per-invoice."
      />

      <SectionTitle>Currency Conversion</SectionTitle>
      <Text style={styles.blurb}>
        When ticked on an invoice, the converted total is calculated from these rates and rounded to the
        nearest 10.
      </Text>
      <PrimaryButton
        title="Fetch Current Exchange Rates"
        onPress={onFetchRates}
        loading={fetchingRates}
        variant="secondary"
      />
      {rateStatus ? <Text style={styles.rateStatus}>{rateStatus}</Text> : null}

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>1 {draft.currencyCode || 'USD'} =</Text>
        <View style={{ flex: 1 }}>
          <Field
            label=""
            value={draft.zarRate != null ? String(draft.zarRate) : ''}
            onChangeText={(v) => draftPatch({ zarRate: v ? parseFloat(v) : null })}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <Text style={styles.rateLabel}>ZAR (R)</Text>
      </View>
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>1 {draft.currencyCode || 'USD'} =</Text>
        <View style={{ flex: 1 }}>
          <Field
            label=""
            value={draft.bwpRate != null ? String(draft.bwpRate) : ''}
            onChangeText={(v) => draftPatch({ bwpRate: v ? parseFloat(v) : null })}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <Text style={styles.rateLabel}>BWP (P)</Text>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton title="Save Settings" onPress={onSaveSettings} loading={savingSettings} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  blurb: { fontSize: 12.5, color: colors.textMuted, marginBottom: spacing.md, marginTop: -4 },
  logoRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, alignItems: 'center' },
  logoPreview: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { fontSize: 11, color: colors.textMuted },
  rateStatus: { fontSize: 12.5, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rateLabel: { fontSize: 13, color: colors.text, fontWeight: '600' },
});
