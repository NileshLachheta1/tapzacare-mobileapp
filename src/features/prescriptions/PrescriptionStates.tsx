import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from '../../components/ui/AppText';
import { Button } from '../../components/ui/Button';
import { CareIcon } from '../../components/ui/CareIcon';
import { Skeleton } from '../../components/ui/Skeleton';
import { useDoses } from './DoseProvider';
import { usePrescriptions } from './PrescriptionsProvider';

export function PrescriptionSkeleton({ detail = false }: { detail?: boolean }) {
  const s = useStyles(makeStyles);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={
        detail ? 'Loading prescription schedule' : 'Loading prescriptions'
      }
      style={s.loading}
    >
      {detail && <Skeleton style={s.summary} />}
      {[0, 1, 2].map(key => (
        <View key={key} style={s.card}>
          <Skeleton style={s.title} />
          <Skeleton style={s.line} />
          <Skeleton style={s.shortLine} />
          {detail && <Skeleton style={s.button} />}
        </View>
      ))}
    </View>
  );
}
export function PrescriptionFetchNotice() {
  const { failed, retry, loading } = usePrescriptions();
  const s = useStyles(makeStyles);
  return failed ? (
    <View style={s.notice} accessibilityLiveRegion="polite">
      <AppText variant="small">
        We couldn’t refresh your prescriptions. Your previous list is still
        here.
      </AppText>
      <Button
        label="Retry prescriptions"
        secondary
        onPress={retry}
        disabled={loading}
      />
    </View>
  ) : null;
}
export function DoseStorageNotice() {
  const { status, tracker } = useDoses();
  const s = useStyles(makeStyles);
  if (status === 'loading') {
    return (
      <View
        style={s.notice}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading saved doses"
      >
        <AppText variant="small" tone="muted">
          Loading your saved dose history…
        </AppText>
      </View>
    );
  }
  return status === 'error' ? (
    <View style={s.notice} accessibilityLiveRegion="polite">
      <CareIcon name="refresh-cw" />
      <AppText weight="semibold">Your dose history couldn’t be loaded</AppText>
      <AppText variant="small">
        Retry before marking doses so your saved history stays safe.
      </AppText>
      <Button
        label="Retry saved doses"
        secondary
        onPress={() => {
          void tracker.hydrate();
        }}
      />
    </View>
  ) : null;
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    loading: { gap: t.spacing.md },
    card: {
      backgroundColor: t.colours.surface,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      gap: t.spacing.md,
    },
    title: { height: t.type.title, width: '70%' },
    line: { height: t.type.small, width: '90%' },
    shortLine: { height: t.type.caption, width: '55%' },
    button: { height: t.metrics.touch, width: '100%' },
    summary: { height: t.metrics.mediaHeight, borderRadius: t.radius.card },
    notice: {
      padding: t.spacing.md,
      gap: t.spacing.sm,
      backgroundColor: t.colours.warmSurface,
      borderRadius: t.radius.card,
    },
  });
