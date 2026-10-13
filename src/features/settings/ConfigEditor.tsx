import React, { useState } from 'react';
import { Modal, ScrollView, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../../config/ConfigProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
export function ConfigEditor() {
  const { rawConfig, applyDraft, resetDraft, variant } = useConfig();
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (reset = false) => {
    setBusy(true);
    setError('');
    try {
      if (reset) await resetDraft();
      else await applyDraft(JSON.parse(draft));
      setOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save configuration.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button
        label="Edit configuration"
        secondary
        onPress={() => {
          setDraft(JSON.stringify(rawConfig, null, 2));
          setError('');
          setOpen(true);
        }}
      />
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <SafeAreaView
          style={[styles.fill, { backgroundColor: t.colours.background }]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.md }}
          >
            <AppText variant="title" weight="bold">
              Live config editor
            </AppText>
            <AppText variant="caption">
              {variant} · JSON · changes are saved on this device
            </AppText>
            <TextInput
              testID="config-editor"
              accessibilityLabel="Configuration JSON"
              value={draft}
              onChangeText={setDraft}
              multiline
              selectTextOnFocus
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              style={[
                styles.input,
                {
                  color: t.colours.textPrimary,
                  backgroundColor: t.colours.surface,
                  borderColor: t.colours.border,

                  borderRadius: t.radius.small,
                  padding: t.spacing.sm,
                },
              ]}
            />
            {error ? (
              <AppText
                accessibilityRole="alert"
                style={{ color: t.colours.danger }}
              >
                {error}
              </AppText>
            ) : null}
            <Button
              label="Apply configuration"
              disabled={busy}
              onPress={() => {
                void save();
              }}
            />
            <Button
              label="Restore bundled configuration"
              secondary
              disabled={busy}
              onPress={() => {
                void save(true);
              }}
            />
            <Button
              label="Close"
              secondary
              disabled={busy}
              onPress={() => setOpen(false)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  input: { height: 320, borderWidth: 1, fontSize: 14 },
});
