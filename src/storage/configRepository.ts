import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseConfig,
  variantSchema,
  type ConfigVariant,
  type LayoutConfig,
} from '../config/schema';
import {
  bundledConfig,
  isAbortError,
  mockApi,
  type MockSettings,
} from '../api/mockApi';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export type ConfigSource = 'remote' | 'cache' | 'bundled';
export type ConfigResult = {
  config: LayoutConfig;
  source: ConfigSource;
  cacheWriteFailed: boolean;
};
export const configCacheKey = (variant: ConfigVariant) =>
  `tapza.config.v1.${variant}`;
const selectionKey = 'tapza.config.selection.v1';
type FetchConfig = (
  variant: ConfigVariant,
  settings: MockSettings,
  signal?: AbortSignal,
) => Promise<unknown>;

export class ConfigRepository {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly fetchConfig: FetchConfig = mockApi.getConfig,
  ) {}
  async selectedVariant(): Promise<ConfigVariant> {
    try {
      const selected = variantSchema.safeParse(
        await this.storage.getItem(selectionKey),
      );
      return selected.success ? selected.data : 'everyday';
    } catch {
      return 'everyday';
    }
  }
  async persistSelection(variant: ConfigVariant): Promise<void> {
    try {
      await this.storage.setItem(selectionKey, variant);
    } catch {
      /* Storage failure must not prevent a theme switch. */
    }
  }
  async load(
    variant: ConfigVariant,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<ConfigResult> {
    try {
      const config = parseConfig(
        await this.fetchConfig(variant, settings, signal),
      );
      if (signal?.aborted) {
        const error = new Error('Request cancelled');
        error.name = 'AbortError';
        throw error;
      }
      let cacheWriteFailed = false;
      try {
        await this.storage.setItem(
          configCacheKey(variant),
          JSON.stringify(config),
        );
      } catch {
        cacheWriteFailed = true;
      }
      return { config, source: 'remote', cacheWriteFailed };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      try {
        const cached = await this.storage.getItem(configCacheKey(variant));
        if (cached) {
          return {
            config: parseConfig(JSON.parse(cached)),
            source: 'cache',
            cacheWriteFailed: false,
          };
        }
      } catch {
        /* Invalid/unavailable cache falls through to a validated built-in layout. */
      }
      return {
        config: parseConfig(bundledConfig(variant)),
        source: 'bundled',
        cacheWriteFailed: false,
      };
    }
  }
}
export const configRepository = new ConfigRepository(AsyncStorage);
