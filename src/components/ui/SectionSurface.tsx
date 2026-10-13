import React, { useId, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
} from 'react-native-svg';
import { z } from 'zod';
import type { Background } from '../../config/schema';
import { useTheme } from '../../theme/ThemeProvider';

const stopsSchema = z.array(z.string().regex(/^#[\da-f]{6}$/i)).min(2);
export function gradientStops(value: string): string[] | null {
  try {
    const result = stopsSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
export function SectionSurface({
  background,
  children,
  style,
}: React.PropsWithChildren<{
  background: Background;
  style?: StyleProp<ViewStyle>;
}>) {
  const t = useTheme();
  const gradientId = useId().replace(/:/g, '');
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const stops =
    background.kind === 'gradient' ? gradientStops(background.value) : null;
  const solid =
    background.kind === 'color' && /^#[\da-f]{6}$/i.test(background.value)
      ? background.value
      : t.colours.surface;
  return (
    <View style={[{ backgroundColor: solid }, style]}>
      {stops && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
        >
          <Svg
            width="100%"
            height="100%"
            pointerEvents="none"
            accessible={false}
          >
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                {stops.map((stop, index) => (
                  <Stop
                    key={`${stop}-${index}`}
                    offset={index / (stops.length - 1)}
                    stopColor={stop}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
          </Svg>
        </View>
      )}
      {background.kind === 'image' && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
          accessibilityElementsHidden
        >
          {background.value === 'asset://clinic-pattern' ? (
            <Svg width="100%" height="100%" accessible={false}>
              <Rect width="100%" height="100%" fill={t.colours.warmSurface} />
              <Circle
                cx="90%"
                cy="70%"
                r="45"
                fill={t.colours.accent}
                opacity={t.opacity.decoration}
              />
              <Circle
                cx="15%"
                cy="10%"
                r="24"
                fill={t.colours.accent}
                opacity={t.opacity.decoration}
              />
            </Svg>
          ) : (
            failedImage !== background.value && (
              <Image
                source={{ uri: background.value }}
                style={StyleSheet.absoluteFill}
                onError={() => setFailedImage(background.value)}
              />
            )
          )}
          {background.value !== 'asset://clinic-pattern' && (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: t.colours.surface,
                  opacity: t.opacity.imageOverlay,
                },
              ]}
            />
          )}
        </View>
      )}
      {children}
    </View>
  );
}
