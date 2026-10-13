import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';

type Props = TextProps & {
  variant?: keyof AppTheme['type'];
  tone?: 'default' | 'muted' | 'primary';
  weight?: keyof AppTheme['weight'];
};
export function AppText({
  variant = 'body',
  tone = 'default',
  weight = 'regular',
  style,
  ...props
}: Props) {
  const theme = useTheme();
  return (
    <Text
      {...props}
      allowFontScaling
      style={[
        {
          fontSize: theme.type[variant],
          fontWeight: theme.weight[weight],
          color:
            tone === 'muted'
              ? theme.colours.textSecondary
              : tone === 'primary'
              ? theme.colours.primary
              : theme.colours.textPrimary,
        },
        style,
      ]}
    />
  );
}
