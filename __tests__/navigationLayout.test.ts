import everyday from '../src/mocks/everyday.json';
import { parseConfig } from '../src/config/schema';
import { createTheme } from '../src/theme/tokens';
import { tabBarHeight } from '../src/navigation/layout';

it('keeps the designed tab height at normal font size and gives wrapped labels room at 2x fonts', () => {
  const config = parseConfig(everyday);
  const theme = createTheme(config);
  const labels = config.tabs.map(tab => tab.label);
  expect(tabBarHeight(theme, 390, 1, labels)).toBe(theme.metrics.tabBar);
  expect(tabBarHeight(theme, 320, 2, labels)).toBeGreaterThan(
    theme.metrics.tabBar,
  );
  expect(tabBarHeight(theme, 320, 3, labels)).toBeGreaterThan(
    tabBarHeight(theme, 320, 2, labels),
  );
});
