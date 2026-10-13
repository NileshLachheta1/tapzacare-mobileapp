import React, { createContext, useContext, useMemo } from 'react';
import type { LayoutConfig } from '../config/schema';
import { createTheme, type AppTheme } from './tokens';

const ThemeContext = createContext<AppTheme | null>(null);
export function ThemeProvider({
  config,
  children,
}: React.PropsWithChildren<{ config: LayoutConfig }>) {
  const theme = useMemo(() => createTheme(config), [config]);
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
export function useTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
}
export function useStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
