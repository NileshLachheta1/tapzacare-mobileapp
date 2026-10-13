import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { usePreferences } from './Preferences';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslate } from '../../i18n';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { ConfigEditor } from './ConfigEditor';
import { useReminders } from '../reminders/RemindersProvider';
import { useOffline } from '../offline/OfflineProvider';
export function SettingsPanel() {
  const p = usePreferences();
  const t = useTheme();
  const tr = useTranslate();
  const reminders = useReminders();
  const network = useOffline();
  return (
    <View style={{ gap: t.spacing.md }}>
      <AppText variant="title" weight="bold">
        Settings
      </AppText>
      <AppText>Language</AppText>
      <View style={[styles.row, { gap: t.spacing.sm }]}>
        <Button
          label="English"
          secondary={p.language !== 'en'}
          disabled={!p.ready}
          onPress={() => {
            void p.update({ language: 'en' });
          }}
        />
        <Button
          label="हिन्दी"
          secondary={p.language !== 'hi'}
          disabled={!p.ready}
          onPress={() => {
            void p.update({ language: 'hi' });
          }}
        />
      </View>
      {[
        {
          label: 'Dark mode',
          value: p.dark,
          change: (dark: boolean) => {
            void p.update({ dark });
          },
        },
        {
          label: 'Haptic feedback',
          value: p.haptics,
          change: (haptics: boolean) => {
            void p.update({ haptics });
          },
        },
        {
          label: 'Simulate offline',
          value: network.simulated,
          change: network.simulate,
        },
      ].map(item => (
        <View
          key={item.label}
          style={[
            styles.row,
            {
              minHeight: t.metrics.touch,
              gap: t.spacing.sm,
            },
          ]}
        >
          <AppText style={styles.flex}>{item.label}</AppText>
          <Switch
            testID={
              item.label === 'Dark mode'
                ? 'dark-mode'
                : item.label === 'Simulate offline'
                ? 'offline-mode'
                : 'haptics'
            }
            accessibilityLabel={tr(item.label)}
            disabled={!p.ready}
            value={item.value}
            onValueChange={item.change}
            trackColor={{ false: t.colours.border, true: t.colours.primary }}
            thumbColor={t.colours.surface}
          />
        </View>
      ))}
      {p.error ? <AppText accessibilityRole="alert">{p.error}</AppText> : null}
      <AppText variant="caption">
        {network.online ? 'Online' : 'Offline · cached times only'}
      </AppText>
      <AppText variant="title" weight="bold">
        Medicine reminders
      </AppText>
      <AppText variant="caption">
        08:00 · 14:00 · 21:00 IST. Seven days ahead, within each medicine’s
        course. Device battery settings can delay delivery.
      </AppText>
      <Button
        label={reminders.enabled ? 'Disable reminders' : 'Enable reminders'}
        disabled={reminders.busy}
        onPress={() => {
          void reminders.toggle();
        }}
      />
      <Button
        label="Test reminder in 10 seconds"
        secondary
        disabled={reminders.busy}
        onPress={() => {
          void reminders.test();
        }}
      />
      {reminders.message ? (
        <AppText accessibilityLiveRegion="polite" variant="caption">
          {reminders.message}
        </AppText>
      ) : null}
      <ConfigEditor />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
});
