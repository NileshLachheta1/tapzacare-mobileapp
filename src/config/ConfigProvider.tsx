import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  bundledConfig,
  defaultMockSettings,
  isAbortError,
  type MockSettings,
} from '../api/mockApi';
import {
  configRepository,
  type ConfigSource,
} from '../storage/configRepository';
import { ThemeProvider } from '../theme/ThemeProvider';
import { parseConfig, type ConfigVariant, type LayoutConfig } from './schema';

type ConfigState = {
  config: LayoutConfig;
  variant: ConfigVariant;
  loading: boolean;
  initialized: boolean;
  source: ConfigSource;
  cacheWriteFailed: boolean;
};
type ConfigContextValue = ConfigState & {
  settings: MockSettings;
  reload(): void;
  switchVariant(): void;
  updateSettings(patch: Partial<MockSettings>): void;
  getMockSettings(): MockSettings;
  consumeConfirmationSettings(): MockSettings;
};
const initialState: ConfigState = {
  config: parseConfig(bundledConfig('everyday')),
  variant: 'everyday',
  loading: true,
  initialized: false,
  source: 'bundled',
  cacheWriteFailed: false,
};
const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [settings, setSettings] = useState(defaultMockSettings);
  const settingsRef = useRef(settings);
  const variantRef = useRef<ConfigVariant>('everyday');
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);

  const load = useCallback(async (variant: ConfigVariant) => {
    const current = ++sequence.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    variantRef.current = variant;
    setState(previous => ({ ...previous, loading: true }));
    try {
      const result = await configRepository.load(
        variant,
        settingsRef.current,
        controller.signal,
      );
      if (current !== sequence.current || controller.signal.aborted) {
        return;
      }
      setState({ ...result, variant, loading: false, initialized: true });
      void configRepository.persistSelection(variant);
    } catch (error) {
      if (!isAbortError(error) && current === sequence.current) {
        setState(previous => ({ ...previous, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void configRepository.selectedVariant().then(variant => {
      if (mounted) {
        void load(variant);
      }
    });
    return () => {
      mounted = false;
      request.current?.abort();
    };
  }, [load]);

  const reload = useCallback(() => {
    void load(variantRef.current);
  }, [load]);
  const switchVariant = useCallback(() => {
    void load(variantRef.current === 'everyday' ? 'diwali' : 'everyday');
  }, [load]);
  const updateSettings = useCallback(
    (patch: Partial<MockSettings>) => {
      settingsRef.current = { ...settingsRef.current, ...patch };
      setSettings(settingsRef.current);
      if (
        Object.keys(patch).some(key =>
          ['latencyMs', 'failConfig', 'failDoctors', 'emptyLists'].includes(
            key,
          ),
        )
      ) {
        void load(variantRef.current);
      }
    },
    [load],
  );
  const getMockSettings = useCallback(() => settingsRef.current, []);
  const consumeConfirmationSettings = useCallback(() => {
    const snapshot = settingsRef.current;
    if (snapshot.bookingOutcome !== 'success') {
      settingsRef.current = { ...snapshot, bookingOutcome: 'success' };
      setSettings(settingsRef.current);
    }
    return snapshot;
  }, []);
  const value = useMemo(
    () => ({
      ...state,
      settings,
      reload,
      switchVariant,
      updateSettings,
      getMockSettings,
      consumeConfirmationSettings,
    }),
    [
      state,
      settings,
      reload,
      switchVariant,
      updateSettings,
      getMockSettings,
      consumeConfirmationSettings,
    ],
  );
  return (
    <ConfigContext.Provider value={value}>
      <ThemeProvider config={state.config}>{children}</ThemeProvider>
    </ConfigContext.Provider>
  );
}
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
}
