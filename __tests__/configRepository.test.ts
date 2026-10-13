import everyday from '../src/mocks/everyday.json';
import diwali from '../src/mocks/diwali.json';
import { defaultMockSettings } from '../src/api/mockApi';
import {
  ConfigRepository,
  configCacheKey,
  type KeyValueStorage,
} from '../src/storage/configRepository';

function memoryStorage(): KeyValueStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: jest.fn(async key => values.get(key) ?? null),
    setItem: jest.fn(async (key, value) => {
      values.set(key, value);
    }),
  };
}
describe('last good config cache', () => {
  it('caches a valid response and restores it when a refresh fails', async () => {
    const storage = memoryStorage();
    const fetchConfig = jest
      .fn()
      .mockResolvedValueOnce({ ...everyday, version: 42 })
      .mockRejectedValueOnce(new Error('offline'));
    const repository = new ConfigRepository(storage, fetchConfig);
    expect(
      (await repository.load('everyday', defaultMockSettings)).source,
    ).toBe('remote');
    const restored = await repository.load('everyday', defaultMockSettings);
    expect(restored.source).toBe('cache');
    expect(restored.config.version).toBe(42);
  });
  it('does not replace a good config with an invalid response', async () => {
    const storage = memoryStorage();
    const fetchConfig = jest
      .fn()
      .mockResolvedValueOnce(everyday)
      .mockResolvedValueOnce({ version: 999 });
    const repository = new ConfigRepository(storage, fetchConfig);
    await repository.load('everyday', defaultMockSettings);
    const lastGood = storage.values.get(configCacheKey('everyday'));
    expect(
      (await repository.load('everyday', defaultMockSettings)).source,
    ).toBe('cache');
    expect(storage.values.get(configCacheKey('everyday'))).toBe(lastGood);
  });
  it('isolates normal/festival caches and uses a bundled fallback on cold-start failure', async () => {
    const storage = memoryStorage();
    storage.values.set(configCacheKey('everyday'), JSON.stringify(everyday));
    const repository = new ConfigRepository(
      storage,
      jest.fn().mockRejectedValue(new Error('offline')),
    );
    const result = await repository.load('diwali', defaultMockSettings);
    expect(result.source).toBe('bundled');
    expect(result.config.theme.primary).toBe(diwali.theme.primary);
    expect(storage.values.has(configCacheKey('diwali'))).toBe(false);
  });
  it('ignores a corrupt cache and tolerates cache write failure', async () => {
    const storage = memoryStorage();
    storage.values.set(configCacheKey('everyday'), 'broken JSON');
    const fallback = new ConfigRepository(
      storage,
      jest.fn().mockRejectedValue(new Error('offline')),
    );
    expect((await fallback.load('everyday', defaultMockSettings)).source).toBe(
      'bundled',
    );
    const fullDisk: KeyValueStorage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full');
      },
    };
    const online = new ConfigRepository(fullDisk, async () => everyday);
    const result = await online.load('everyday', defaultMockSettings);
    expect(result.source).toBe('remote');
    expect(result.cacheWriteFailed).toBe(true);
  });
  it('never falls back or updates the cache after cancellation', async () => {
    const storage = memoryStorage();
    const controller = new AbortController();
    controller.abort();
    const repository = new ConfigRepository(storage, async () => everyday);
    await expect(
      repository.load('everyday', defaultMockSettings, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(storage.values.size).toBe(0);
  });
});
