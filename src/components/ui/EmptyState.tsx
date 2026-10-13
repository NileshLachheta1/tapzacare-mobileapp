import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';
import { CareIcon } from './CareIcon';

export function EmptyState({
  title,
  message,
  icon = 'heart',
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const s = useStyles(makeStyles);
  const t = useTheme();
  return (
    <View style={s.root}>
      <View style={s.icon}>
        <CareIcon name={icon} size={t.metrics.largeIcon} />
      </View>
      <AppText variant="title" weight="semibold" style={s.text}>
        {title}
      </AppText>
      <AppText tone="muted" variant="small" style={s.text}>
        {message}
      </AppText>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={s.button} />
      )}
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: {
      padding: t.spacing.xl,
      paddingVertical: t.spacing.xxxl,
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    icon: {
      width: t.metrics.actionIcon + t.spacing.xl,
      height: t.metrics.actionIcon + t.spacing.xl,
      borderRadius: t.radius.sheet,
      backgroundColor: t.colours.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: t.spacing.xs,
    },
    text: { textAlign: 'center' },
    button: { marginTop: t.spacing.sm },
  });
