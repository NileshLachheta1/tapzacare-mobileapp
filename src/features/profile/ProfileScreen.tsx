import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConfig } from '../../config/ConfigProvider';
import { defaultMockSettings } from '../../api/mockApi';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { CareIcon } from '../../components/ui/CareIcon';

export function ProfileScreen() {
  const { variant, loading, source, settings, switchVariant, updateSettings } =
    useConfig();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const controls = [
    {
      key: 'failConfig',
      label: 'Fail configuration fetch',
      value: settings.failConfig,
    },
    {
      key: 'failDoctors',
      label: 'Fail doctor fetch',
      value: settings.failDoctors,
    },
    {
      key: 'emptyLists',
      label: 'Return empty lists',
      value: settings.emptyLists,
    },
    {
      key: 'failSlots',
      label: 'Fail available times fetch',
      value: settings.failSlots,
    },
    {
      key: 'emptySlots',
      label: 'Return no available times',
      value: settings.emptySlots,
    },
    {
      key: 'failPrescriptions',
      label: 'Fail prescriptions fetch',
      value: settings.failPrescriptions,
    },
    {
      key: 'emptyPrescriptions',
      label: 'Return no prescriptions',
      value: settings.emptyPrescriptions,
    },
    {
      key: 'failDoseSave',
      label: 'Fail dose history saves',
      value: settings.failDoseSave,
    },
  ] as const;
  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[
        s.content,
        { paddingTop: insets.top + t.spacing.xl },
      ]}
    >
      <AppText variant="hero" weight="bold" accessibilityRole="header">
        Your care, your way
      </AppText>
      <AppText tone="muted" variant="small" style={s.subtitle}>
        One familiar place for your family.
      </AppText>
      <View style={s.patient}>
        <View style={s.flex}>
          <AppText variant="title" weight="semibold">
            Lakshmi Rao
          </AppText>
          <AppText variant="small" tone="primary">
            Madhapur, Hyderabad
          </AppText>
        </View>
        <CareIcon name="user-round" size={t.metrics.largeIcon} />
      </View>
      <AppText variant="small" tone="muted">
        Tapza Family Clinic
      </AppText>
      <Button
        label={
          variant === 'everyday'
            ? 'Switch to Diwali home'
            : 'Switch to everyday home'
        }
        icon="sparkles"
        secondary
        disabled={loading}
        onPress={switchVariant}
      />
      <View style={s.demo}>
        <AppText variant="title" weight="semibold" accessibilityRole="header">
          Assignment demo controls
        </AppText>
        <AppText variant="small" tone="muted">
          Changes refresh the mock responses so you can review loading, empty
          and failure states.
        </AppText>
        <View style={s.latency}>
          <Button
            label="Normal network"
            secondary={settings.latencyMs !== 350}
            onPress={() => updateSettings({ latencyMs: 350 })}
            style={s.flex}
          />
          <Button
            label="Slow network"
            secondary={settings.latencyMs !== 2200}
            onPress={() => updateSettings({ latencyMs: 2200 })}
            style={s.flex}
          />
        </View>
        {controls.map(control => (
          <View key={control.key} style={s.row}>
            <AppText variant="small" style={s.flex}>
              {control.label}
            </AppText>
            <Switch
              accessibilityLabel={control.label}
              value={control.value}
              onValueChange={value => updateSettings({ [control.key]: value })}
              trackColor={{ false: t.colours.border, true: t.colours.primary }}
              thumbColor={t.colours.surface}
              hitSlop={t.spacing.sm}
            />
          </View>
        ))}
        <AppText variant="small" weight="semibold">
          Next booking confirmation
        </AppText>
        <AppText variant="caption" tone="muted">
          A failure or conflict affects one confirmation, then resets to success
          so you can retry.
        </AppText>
        {(['success', 'error', 'conflict'] as const).map(outcome => (
          <Button
            key={outcome}
            label={
              outcome === 'success'
                ? 'Confirm successfully (201)'
                : outcome === 'error'
                ? 'Fail next confirmation (503)'
                : 'Conflict next slot (409)'
            }
            secondary={settings.bookingOutcome !== outcome}
            onPress={() => updateSettings({ bookingOutcome: outcome })}
          />
        ))}
        <AppText
          variant="caption"
          tone="muted"
          accessibilityLiveRegion="polite"
        >
          {loading
            ? 'Refreshing configuration…'
            : `Home source: ${
                source === 'remote'
                  ? 'mock API'
                  : source === 'cache'
                  ? 'last good cache'
                  : 'bundled fallback'
              }`}
        </AppText>
        <Button
          label="Restore normal responses"
          secondary
          onPress={() => updateSettings(defaultMockSettings)}
        />
      </View>
    </ScrollView>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colours.background },
    content: { padding: t.spacing.lg, gap: t.spacing.md },
    flex: { flex: 1 },
    subtitle: { marginTop: -t.spacing.xs },
    patient: {
      backgroundColor: t.colours.secondary,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      marginTop: t.spacing.xs,
    },
    demo: { marginTop: t.spacing.lg, gap: t.spacing.md },
    latency: { flexDirection: 'row', gap: t.spacing.xs },
    row: {
      minHeight: t.metrics.touch + t.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      borderBottomColor: t.colours.border,
      borderBottomWidth: t.metrics.border,
    },
  });
