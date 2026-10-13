import type { LayoutConfig } from './schema';
export function applyAppearance(
  config: LayoutConfig,
  dark: boolean,
): LayoutConfig {
  const palette = dark ? config.darkTheme : undefined;
  if (!palette) return config;
  return {
    ...config,
    theme: { ...config.theme, ...palette },
    sections: config.sections.map(section => ({
      ...section,
      background: config.darkBackgrounds?.[section.id] ?? {
        kind: 'color',
        value: palette.background,
      },
    })),
  };
}
