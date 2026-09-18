import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, SectionTitle } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { fetchLiveRates } from '../../lib/exchangeRates';
import { colors, radius, spacing } from '../../theme';
import { Settings } from '../../types';

export default function SettingsScreen() {
  const {
    settings,
    updateSettings,
    connection,
    connecting,
    syncing,
    syncError,
    connectToApi,
    disconnectFromApi,
    refreshAll,
  } = useData();

  const [fetchingRates, setFetchingRates] = useState(false);
  const [rateStatus, setRateStatus] = useState<string | null>(null);
  const [draft, setDraft] = useState<Settings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [connectError, setConnectError] = useState<string | null>(null);

  const draftPatch = (patch: Partial<Settings>) => setDraft((prev) => ({ ...prev, ...patch }));

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
      await updateSettings({ logoUri: `${dest.uri}?t=${Date.now()}` });
    } catch {
      await updateSettings({ logoUri: picked.uri });
    }
  };

  const removeLogo = () => updateSettings({ logoUri: null });

  const onFetchRates = async () => {
    setFetchingRates(true);
    setRateStatus(null);
    try {
      const result = await fetchLiveRates();
      const zarRate = result.zar ?? draft.zarRate;
      const bwpRate = result.bwp ?? draft.bwpRate;
      draftPatch({ zarRate, bwpRate });
      await updateSettings({ zarRate, bwpRate });
      setRateStatus(`Updated from ${result.source}.`);
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

  const onConnect = async () => {
    if (!siteUrl.trim() || !username.trim() || !appPassword.trim()) {
      setConnectError('Fill in the site URL, username, and application password.');
      return;
    }
    setConnectError(null);
    try {
      await connectToApi(siteUrl, username, appPassword);
      setAppPassword('');
    } catch (err: any) {
      setConnectError(err?.message ?? 'Could not connect.');
    }
  };

  const onDisconnect = () => {
    Alert.alert(
      'Disconnect from WordPress?',
      'The app will go back to storing invoices, clients, and payment methods only on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectFromApi();
            setSiteUrl('');
            setUsername('');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionTitle>Connect to WordPress</SectionTitle>
      {connection ? (
        <View style={styles.connectedBox}>
          <Text style={styles.connectedTitle}>Connected</Text>
          <Text style={styles.connectedMeta}>{connection.siteUrl}</Text>
          <Text style={styles.connectedMeta}>as {connection.username}</Text>
          <Text style={styles.blurb}>
            Invoices, clients, and payment methods are fetched from and saved directly to this site — the
            same data wp-admin manages, so both stay in sync.
          </Text>
          {syncError ? <Text style={styles.errorText}>{syncError}</Text> : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Refresh Now" onPress={refreshAll} loading={syncing} variant="secondary" />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Disconnect" onPress={onDisconnect} variant="danger" />
            </View>
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.blurb}>
            Connect to the Custom Invoices plugin on your WordPress site to fetch existing invoices and
            manage them from here — changes save straight to the site, so wp-admin sees them too.
          </Text>
          <Field
            label="Site URL"
            value={siteUrl}
            onChangeText={setSiteUrl}
            placeholder="https://ngatinyore.co.zw"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <Field
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="admin"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label="Application Password"
            value={appPassword}
            onChangeText={setAppPassword}
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            hint="Users → your profile → Application Passwords on the site, not your login password."
          />
          {connectError ? <Text style={styles.errorText}>{connectError}</Text> : null}
          <PrimaryButton title="Connect" onPress={onConnect} loading={connecting} />
          <Pressable
            onPress={() => siteUrl.trim() && Linking.openURL(`${siteUrl.trim().replace(/\/+$/, '')}/wp-admin/profile.php`)}
            style={{ marginTop: spacing.sm }}
          >
            <Text style={styles.linkText}>Open your profile page to create one →</Text>
          </Pressable>
        </View>
      )}

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
        {connection ? (
          <Text style={[styles.blurb, { flex: 1, marginBottom: 0 }]}>
            Change the logo from the site's Business Details page in wp-admin — uploading isn't supported
            from the app yet.
          </Text>
        ) : (
          <View style={{ flex: 1, gap: spacing.sm }}>
            <PrimaryButton title="Select Logo" onPress={pickLogo} variant="secondary" />
            {draft.logoUri ? <PrimaryButton title="Remove" onPress={removeLogo} variant="danger" /> : null}
          </View>
        )}
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
  errorText: { fontSize: 12.5, color: colors.danger, marginBottom: spacing.sm },
  linkText: { fontSize: 12.5, color: colors.primary, fontWeight: '600' },
  connectedBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  connectedTitle: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  connectedMeta: { fontSize: 12.5, color: colors.text, marginTop: 2 },
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
