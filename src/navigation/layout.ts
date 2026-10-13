import type { AppTheme } from '../theme/tokens';

export function tabBarHeight(
  theme: AppTheme,
  width: number,
  fontScale: number,
  labels: string[],
): number {
  const cellWidth = Math.max(
    theme.metrics.touch,
    width / Math.max(1, labels.length) - theme.spacing.xs,
  );
  const longest = Math.max(1, ...labels.map(label => label.length));
  const lines = Math.ceil(
    (longest *
      theme.type.caption *
      fontScale *
      theme.metrics.tabLabelWidthFactor) /
      cellWidth,
  );
  return Math.max(
    theme.metrics.tabBar,
    theme.metrics.icon +
      theme.spacing.xs * 2 +
      theme.type.caption * fontScale * lines * theme.metrics.tabLabelLineHeight,
  );
}
