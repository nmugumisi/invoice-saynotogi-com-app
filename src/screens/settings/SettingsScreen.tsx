import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, SectionTitle } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { fetchLiveRates } from '../../lib/exchangeRates';
import { colors, radius, spacing } from '../../theme';

export default function SettingsScreen() {
  const { settings, updateSettings } = useData();
  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateStatus, setRateStatus] = useState<string | null>(null);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const picked = result.assets[0];
    try {
      const ext = picked.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const source = new File(picked.uri);
      const dest = new File(Paths.document, `logo.${ext}`);
      if (dest.exists) dest.delete();
      await source.copy(dest);
      updateSettings({ logoUri: `${dest.uri}?t=${Date.now()}` });
    } catch {
      updateSettings({ logoUri: picked.uri });
    }
  };

  const removeLogo = () => updateSettings({ logoUri: null });

  const onFetchRates = async () => {
    setFetchingRates(true);
    setRateStatus(null);
    try {
      const result = await fetchLiveRates();
      updateSettings({
        zarRate: result.zar ?? settings.zarRate,
        bwpRate: result.bwp ?? settings.bwpRate,
      });
      setRateStatus(`Updated from ${result.source}.`);
    } catch (err: any) {
      setRateStatus(err?.message ?? 'Could not fetch rates.');
    } finally {
      setFetchingRates(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionTitle>Business Details</SectionTitle>
      <Text style={styles.blurb}>Shown at the top of every invoice — logo, name, address, contact.</Text>

      <View style={styles.logoRow}>
        <View style={styles.logoPreview}>
          {settings.logoUri ? (
            <Image source={{ uri: settings.logoUri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={styles.logoPlaceholder}>No logo</Text>
          )}
        </View>
        <View style={{ flex: 1, gap: spacing.sm }}>
          <PrimaryButton title="Select Logo" onPress={pickLogo} variant="secondary" />
          {settings.logoUri ? (
            <PrimaryButton title="Remove" onPress={removeLogo} variant="danger" />
          ) : null}
        </View>
      </View>

      <Field
        label="Company / Your Name"
        value={settings.companyName}
        onChangeText={(v) => updateSettings({ companyName: v })}
      />
      <Field
        label="Address"
        value={settings.companyAddress}
        onChangeText={(v) => updateSettings({ companyAddress: v })}
        multiline
      />
      <Field
        label="Phone"
        value={settings.companyPhone}
        onChangeText={(v) => updateSettings({ companyPhone: v })}
        keyboardType="phone-pad"
      />
      <Field
        label="Email"
        value={settings.companyEmail}
        onChangeText={(v) => updateSettings({ companyEmail: v })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <SectionTitle>Invoice Defaults</SectionTitle>
      <Field
        label="Invoice Number Prefix"
        value={settings.invoicePrefix}
        onChangeText={(v) => updateSettings({ invoicePrefix: v })}
        placeholder="e.g. INV- (leave blank for plain numbers)"
      />
      <Field
        label="Starting Invoice Number"
        value={String(settings.startNumber)}
        onChangeText={(v) => updateSettings({ startNumber: parseInt(v, 10) || 0 })}
        keyboardType="number-pad"
        hint="Used only for the very first invoice — after that, numbering continues automatically."
      />
      <Field
        label="Currency Symbol"
        value={settings.currencySymbol}
        onChangeText={(v) => updateSettings({ currencySymbol: v })}
      />
      <Field
        label="Currency Code"
        value={settings.currencyCode}
        onChangeText={(v) => updateSettings({ currencyCode: v })}
      />
      <Field
        label="Default Notes to Customer"
        value={settings.defaultNotes}
        onChangeText={(v) => updateSettings({ defaultNotes: v })}
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
        <Text style={styles.rateLabel}>1 {settings.currencyCode || 'USD'} =</Text>
        <View style={{ flex: 1 }}>
          <Field
            label=""
            value={settings.zarRate != null ? String(settings.zarRate) : ''}
            onChangeText={(v) => updateSettings({ zarRate: v ? parseFloat(v) : null })}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <Text style={styles.rateLabel}>ZAR (R)</Text>
      </View>
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>1 {settings.currencyCode || 'USD'} =</Text>
        <View style={{ flex: 1 }}>
          <Field
            label=""
            value={settings.bwpRate != null ? String(settings.bwpRate) : ''}
            onChangeText={(v) => updateSettings({ bwpRate: v ? parseFloat(v) : null })}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>
        <Text style={styles.rateLabel}>BWP (P)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
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
