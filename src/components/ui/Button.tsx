import React from 'react';
import { usePreferences } from '../../features/settings/Preferences';
import { haptic } from '../../features/settings/haptics';
import { useTranslate } from '../../i18n';
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { AppText } from './AppText';
import { CareIcon } from './CareIcon';

export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress(): void;
  icon?: string;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { haptics } = usePreferences();
  const tr = useTranslate();
  const theme = useTheme();
  const styles = useStyles(makeStyles);
  const colour = secondary ? theme.colours.primary : theme.colours.onPrimary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      accessibilityLabel={tr(label)}
      onPress={() => {
        haptic(haptics);
        onPress();
      }}
      style={({ pressed }) => [
        styles.root,
        secondary && styles.secondary,
        style,
        {
          opacity: disabled
            ? theme.opacity.disabled
            : pressed
            ? theme.opacity.pressed
            : 1,
        },
      ]}
    >
      <AppText
        variant="small"
        weight="semibold"
        style={[styles.text, { color: colour }]}
      >
        {label}
      </AppText>
      {icon && (
        <CareIcon name={icon} size={theme.metrics.smallIcon} colour={colour} />
      )}
    </Pressable>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: {
      minHeight: t.metrics.touch,
      borderRadius: t.radius.button,
      backgroundColor: t.colours.primary,
      paddingVertical: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
    },
    secondary: { backgroundColor: t.colours.secondary },
    text: { flexShrink: 1 },
  });
