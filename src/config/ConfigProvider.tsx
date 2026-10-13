import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePreferences } from '../features/settings/Preferences';
import { applyAppearance } from './appearance';
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
  rawConfig: LayoutConfig;
  applyDraft(value: unknown): Promise<void>;
  resetDraft(): Promise<void>;
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
  const { dark } = usePreferences();
  const drafts = useRef<Partial<Record<ConfigVariant, LayoutConfig>>>({});
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
      let draft = drafts.current[variant];
      if (!draft) {
        try {
          const saved = await AsyncStorage.getItem(`tapza.admin.v1.${variant}`);
          if (saved) draft = parseConfig(JSON.parse(saved));
        } catch {
          /* Invalid local edits do not replace validated server config. */
        }
      }
      if (current !== sequence.current || controller.signal.aborted) return;
      if (draft) drafts.current[variant] = draft;
      setState({
        ...result,
        config: draft ?? result.config,
        variant,
        loading: false,
        initialized: true,
      });
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
  const applyDraft = useCallback(async (input: unknown) => {
    const config = parseConfig(input);
    if (!config.tabs.some(tab => tab.screen === 'profile'))
      throw new Error('Keep the Profile tab so the editor stays reachable.');
    const variant = variantRef.current;
    await AsyncStorage.setItem(
      `tapza.admin.v1.${variant}`,
      JSON.stringify(config),
    );
    drafts.current[variant] = config;
    if (variantRef.current === variant) {
      ++sequence.current;
      request.current?.abort();
      setState(previous => ({
        ...previous,
        config,
        loading: false,
        initialized: true,
      }));
    }
  }, []);
  const resetDraft = useCallback(async () => {
    const variant = variantRef.current;
    await AsyncStorage.removeItem(`tapza.admin.v1.${variant}`);
    delete drafts.current[variant];
    await load(variant);
  }, [load]);
  const config = useMemo(
    () => applyAppearance(state.config, dark),
    [state.config, dark],
  );
  const value = useMemo(
    () => ({
      ...state,
      config,
      rawConfig: state.config,
      applyDraft,
      resetDraft,
      settings,
      reload,
      switchVariant,
      updateSettings,
      getMockSettings,
      consumeConfirmationSettings,
    }),
    [
      state,
      config,
      applyDraft,
      resetDraft,
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
      <ThemeProvider config={config}>{children}</ThemeProvider>
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
