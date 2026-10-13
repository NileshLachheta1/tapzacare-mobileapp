import React, { useEffect, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useStyles, useTheme } from '../../theme/ThemeProvider';
import type { AppTheme } from '../../theme/tokens';
import { CareIcon } from './CareIcon';
import { AppText } from './AppText';

const assetIcons: Record<string, string> = {
  'asset://checkup': 'heart-pulse',
  'asset://blood': 'test-tube-diagonal',
  'asset://consult': 'stethoscope',
  'asset://vaccine': 'syringe',
  'asset://family': 'users',
};
export function HeroArtwork({ festival = false }: { festival?: boolean }) {
  const t = useTheme();
  return (
    <Svg viewBox="0 0 140 180" width="100%" height="100%" accessible={false}>
      <Circle
        cx="93"
        cy="112"
        r="64"
        fill={t.colours.accent}
        opacity={t.opacity.decoration}
      />
      <Path
        d="M42 154V80a39 39 0 0 1 78 0v74Z"
        fill={t.colours.surface}
        fillOpacity={t.opacity.decoration}
        stroke={t.colours.primary}
        strokeOpacity={t.opacity.decoration}
      />
      <Path
        d="M24 162C-2 147 2 122 6 108c20 12 33 28 18 54Z"
        fill={t.colours.primary}
        opacity={t.opacity.decoration}
      />
      <Path
        d="M25 155C14 125 21 99 28 85c14 15 18 43-3 70Z"
        fill={t.colours.primary}
        opacity={t.opacity.decoration}
      />
      {festival ? (
        <>
          <Path d="M59 110h44c-3 29-41 29-44 0Z" fill={t.colours.primary} />
          <Path
            d="M80 106c-19-16 0-29 3-40 15 23 16 31-3 40Z"
            fill={t.colours.warmText}
          />
          <Ellipse cx="81" cy="114" rx="22" ry="4" fill={t.colours.accent} />
        </>
      ) : (
        <>
          <Rect
            x="58"
            y="79"
            width="47"
            height="44"
            rx="11"
            fill={t.colours.primary}
          />
          <Path
            d="M73 79v-8h17v8M81 90v23M69 101h24"
            stroke={t.colours.onPrimary}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      <Path
        d="M115 18v14M108 25h14M124 40v8M120 44h8"
        stroke={t.colours.primary}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
export function ConfiguredImage({
  url,
  label,
  style,
  initials,
}: {
  url: string;
  label: string;
  style?: StyleProp<ViewStyle>;
  initials?: string;
}) {
  const [failed, setFailed] = useState(false);
  const styles = useStyles(makeStyles);
  const t = useTheme();
  useEffect(() => setFailed(false), [url]);
  const local = url.startsWith('asset://');
  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {local ? (
        <View style={styles.art}>
          <View style={styles.circle} />
          <CareIcon
            name={assetIcons[url] ?? 'heart-pulse'}
            size={t.metrics.largeIcon}
          />
        </View>
      ) : failed ? (
        <AppText tone="primary" weight="semibold">
          {initials ?? 'Care'}
        </AppText>
      ) : (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessible={false}
        />
      )}
    </View>
  );
}
const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    root: {
      backgroundColor: t.colours.secondary,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    art: { alignItems: 'center', justifyContent: 'center' },
    circle: {
      position: 'absolute',
      width: t.metrics.actionIcon + t.spacing.lg,
      height: t.metrics.actionIcon + t.spacing.lg,
      borderRadius: t.radius.pill,
      backgroundColor: t.colours.surface,
      opacity: t.opacity.decoration,
    },
  });
