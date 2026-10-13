import type { TextStyle } from 'react-native';
import type { LayoutConfig } from '../config/schema';

const rgb = (hex: string) =>
  [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
export function mix(a: string, b: string, amount: number): string {
  const from = rgb(a);
  const to = rgb(b);
  return (
    '#' +
    from
      .map((value, index) =>
        Math.round(value + ((to[index] ?? 0) - value) * amount)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
function luminance(hex: string) {
  const channels = rgb(hex).map(value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}
export function contrastRatio(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
}
const light = '#FFFFFF';
const dark = '#172E29';

export function createTheme(config: LayoutConfig) {
  const { theme: colours, designTokens } = config;
  const s = designTokens?.spacingScale ?? 1;
  const f = designTokens?.fontScale ?? 1;
  const r = designTokens?.radiusScale ?? 1;
  return {
    colours: {
      ...colours,
      onPrimary:
        contrastRatio(colours.primary, light) >=
        contrastRatio(colours.primary, dark)
          ? light
          : dark,
      surfaceAlt:
        colours.surfaceAlt ?? mix(colours.surface, colours.primary, 0.05),
      border: colours.border ?? mix(colours.surface, colours.textPrimary, 0.12),
      warmSurface:
        colours.warmSurface ?? mix(colours.surface, colours.accent, 0.25),
      warmText: colours.warmText ?? colours.textPrimary,
      danger: colours.danger ?? '#9B3229',
      dangerSurface: colours.dangerSurface ?? '#FFF0EA',
      transparent: 'transparent',
      backdrop: '#172E2970',
      skeleton: mix(colours.surface, colours.primary, 0.09),
    },
    spacing: {
      xxs: 4 * s,
      xs: 8 * s,
      sm: 12 * s,
      md: 16 * s,
      lg: 20 * s,
      xl: 24 * s,
      xxl: 32 * s,
      xxxl: 40 * s,
    },
    type: {
      caption: 12 * f,
      small: 14 * f,
      body: 16 * f,
      title: 19 * f,
      brand: 25 * f,
      hero: 28 * f,
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    } satisfies Record<string, TextStyle['fontWeight']>,
    radius: {
      small: 10 * r,
      button: 14 * r,
      media: 17 * r,
      card: 20 * r,
      sheet: 28 * r,
      pill: 999,
    },
    metrics: {
      touch: 48,
      icon: 22,
      smallIcon: 17,
      largeIcon: 40,
      stroke: 1.7,
      brandMark: 30,
      actionIcon: 54,
      avatar: 60,
      mediaHeight: 100,
      doctorWidth: 264,
      header: 72,
      compactHeader: 56,
      collapseDistance: 80,
      tabBar: 72,
      tabLabelWidthFactor: 0.65,
      tabLabelLineHeight: 1.4,
      heroArtWidth: 120,
      heroArtHeight: 170,
      skeletonHero: 250,
      border: 1,
      elevation: 2,
      dateWidth: 76,
      slotWidth: 98,
      successMark: 88,
      sheetHandleWidth: 40,
      sheetHandleHeight: 4,
    },
    motion: {
      reveal: 360,
      shimmer: 1100,
      revealDistance: 12,
      parallax: 0.16,
      success: 460,
      successStartScale: 0.6,
    },
    booking: { snapPoints: ['76%', '94%'], backdropOpacity: 0.4 },
    opacity: {
      pressed: 0.78,
      disabled: 0.45,
      imageOverlay: 0.88,
      decoration: 0.5,
    },
  };
}
export type AppTheme = ReturnType<typeof createTheme>;
