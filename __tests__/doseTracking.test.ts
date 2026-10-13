import fixtures from '../src/mocks/prescriptions.json';
import {
  prescriptionsSchema,
  type DoseRecords,
} from '../src/features/prescriptions/contracts';
import {
  DoseTracker,
  type DoseStorage,
} from '../src/features/prescriptions/DoseTracker';
import {
  doseKey,
  doseProgress,
  scheduledDoses,
} from '../src/features/prescriptions/schedule';
import { DoseRepository, doseStorageKey } from '../src/storage/doseRepository';
import type { KeyValueStorage } from '../src/storage/configRepository';

const prescriptions = prescriptionsSchema.parse(fixtures);
const prescription = prescriptions[0]!;
const patientId = 'lakshmi-rao';
const date = '2026-10-13';
const medicineId = 'daily-supplement';
const key = (timing: 'morning' | 'afternoon' | 'night', day = date) =>
  doseKey({
    patientId,
    prescriptionId: prescription.id,
    medicineId,
    date: day,
    timing,
  });
const now = Date.parse('2026-10-13T04:30:00Z');
function setup() {
  const values = new Map<string, string>();
  const storage: KeyValueStorage = {
    getItem: jest.fn(async id => values.get(id) ?? null),
    setItem: jest.fn(async (id, value) => {
      values.set(id, value);
    }),
  };
  const repository = new DoseRepository(storage);
  return {
    values,
    storage,
    repository,
    tracker: new DoseTracker(patientId, repository, () => now),
  };
}
describe('daily dose tracking and persistence', () => {
  it('saves one morning dose without taking afternoon, night, another medicine or another date', async () => {
    const { tracker } = setup();
    await tracker.hydrate();
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(Object.keys(tracker.getSnapshot().records)).toEqual([
      key('morning'),
    ]);
    expect(
      doseProgress(
        prescription,
        date,
        patientId,
        tracker.getSnapshot().records,
      ),
    ).toEqual({ taken: 1, total: 5 });
    expect(
      doseProgress(
        prescription,
        '2026-10-12',
        patientId,
        tracker.getSnapshot().records,
      ).taken,
    ).toBe(0);
    expect(tracker.getSnapshot().records[key('afternoon')]).toBeUndefined();
    expect(tracker.getSnapshot().records[key('night')]).toBeUndefined();
  });
  it('restores a taken dose after a fresh tracker starts, and persists undo', async () => {
    const { repository, tracker } = setup();
    await tracker.hydrate();
    await tracker.toggle(prescription, medicineId, date, 'morning');
    const restarted = new DoseTracker(patientId, repository, () => now);
    await restarted.hydrate();
    expect(restarted.getSnapshot().records[key('morning')]).toBeTruthy();
    await restarted.toggle(prescription, medicineId, date, 'morning');
    const third = new DoseTracker(patientId, repository, () => now);
    await third.hydrate();
    expect(third.getSnapshot().records).toEqual({});
  });
  it('keeps patients and prescriptions isolated even when medicine IDs match', async () => {
    const { repository, tracker } = setup();
    await tracker.hydrate();
    await tracker.toggle(prescription, 'multivitamin', date, 'night');
    expect(
      doseProgress(
        prescriptions[1]!,
        date,
        patientId,
        tracker.getSnapshot().records,
      ).taken,
    ).toBe(0);
    const other = new DoseTracker('other-patient', repository, () => now);
    await other.hydrate();
    expect(other.getSnapshot().records).toEqual({});
    await other.toggle(prescription, 'multivitamin', date, 'night');
    expect(Object.values(other.getSnapshot().records)[0]?.patientId).toBe(
      'other-patient',
    );
    await tracker.hydrate();
    expect(Object.values(tracker.getSnapshot().records)[0]?.patientId).toBe(
      patientId,
    );
  });
  it('serializes quick writes to different doses without losing either change', async () => {
    const { tracker, storage, repository } = setup();
    await tracker.hydrate();
    await Promise.all([
      tracker.toggle(prescription, medicineId, date, 'morning'),
      tracker.toggle(prescription, medicineId, date, 'afternoon'),
      tracker.toggle(prescription, medicineId, date, 'night'),
    ]);
    expect(storage.setItem).toHaveBeenCalledTimes(3);
    expect(Object.keys(await repository.load(patientId))).toHaveLength(3);
    expect(tracker.getSnapshot().saving).toEqual([]);
  });
  it('shows saving, blocks repeated taps and publishes taken only after a successful write', async () => {
    let resolveSave!: () => void;
    const save = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveSave = resolve;
        }),
    );
    const tracker = new DoseTracker(
      patientId,
      { load: async () => ({}), save },
      () => now,
    );
    await tracker.hydrate();
    const pending = tracker.toggle(prescription, medicineId, date, 'morning');
    await Promise.resolve();
    expect(tracker.getSnapshot().saving).toEqual([key('morning')]);
    expect(tracker.getSnapshot().records).toEqual({});
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(save).toHaveBeenCalledTimes(1);
    resolveSave();
    await pending;
    expect(tracker.getSnapshot().records[key('morning')]).toBeTruthy();
  });
  it('keeps a failed change untaken, then permits retry without affecting another queued dose', async () => {
    const { repository } = setup();
    let fail = true;
    const tracker = new DoseTracker(
      patientId,
      {
        load: id => repository.load(id),
        save: async (id, records) => {
          if (fail) {
            fail = false;
            throw new Error('disk unavailable');
          }
          await repository.save(id, records);
        },
      },
      () => now,
    );
    await tracker.hydrate();
    await Promise.all([
      tracker.toggle(prescription, medicineId, date, 'morning'),
      tracker.toggle(prescription, medicineId, date, 'night'),
    ]);
    expect(tracker.getSnapshot().records[key('morning')]).toBeUndefined();
    expect(tracker.getSnapshot().records[key('night')]).toBeTruthy();
    expect(tracker.getSnapshot().errors).toEqual([key('morning')]);
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(Object.keys(await repository.load(patientId))).toHaveLength(2);
    expect(tracker.getSnapshot().errors).toEqual([]);
  });
  it('keeps a taken dose taken if its undo cannot be saved', async () => {
    const { repository } = setup();
    let fail = false;
    const tracker = new DoseTracker(
      patientId,
      {
        load: id => repository.load(id),
        save: async (id, records) => {
          if (fail) {
            throw new Error('save failed');
          }
          await repository.save(id, records);
        },
      },
      () => now,
    );
    await tracker.hydrate();
    await tracker.toggle(prescription, medicineId, date, 'morning');
    fail = true;
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(tracker.getSnapshot().records[key('morning')]).toBeTruthy();
    expect((await repository.load(patientId))[key('morning')]).toBeTruthy();
    expect(tracker.getSnapshot().errors).toEqual([key('morning')]);
  });
  it('blocks edits until history loads and supports read failure recovery', async () => {
    const save = jest.fn();
    let fail = true;
    const storage: DoseStorage = {
      load: async () => {
        if (fail) {
          throw new Error('read failed');
        }
        return {};
      },
      save,
    };
    const tracker = new DoseTracker(patientId, storage, () => now);
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(save).not.toHaveBeenCalled();
    await tracker.hydrate();
    expect(tracker.getSnapshot().status).toBe('error');
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(save).not.toHaveBeenCalled();
    fail = false;
    await tracker.hydrate();
    expect(tracker.getSnapshot().status).toBe('ready');
  });
  it('rejects corrupted or wrong-patient saved history instead of overwriting it', async () => {
    const { values, tracker, storage } = setup();
    values.set(doseStorageKey(patientId), '{bad JSON');
    await tracker.hydrate();
    expect(tracker.getSnapshot().status).toBe('error');
    await tracker.toggle(prescription, medicineId, date, 'morning');
    expect(storage.setItem).not.toHaveBeenCalled();
    values.set(
      doseStorageKey(patientId),
      JSON.stringify({
        version: 1,
        entries: [
          {
            patientId: 'other',
            prescriptionId: prescription.id,
            medicineId,
            date,
            timing: 'morning',
            takenAt: new Date(now).toISOString(),
          },
        ],
      }),
    );
    await tracker.hydrate();
    expect(tracker.getSnapshot().status).toBe('error');
    values.delete(doseStorageKey(patientId));
    await tracker.hydrate();
    expect(tracker.getSnapshot().status).toBe('ready');
  });
  it('ignores a stale history load after a newer retry completes', async () => {
    const resolvers: ((value: DoseRecords) => void)[] = [];
    const tracker = new DoseTracker(
      patientId,
      {
        load: () => new Promise(resolve => resolvers.push(resolve)),
        save: async () => {},
      },
      () => now,
    );
    const first = tracker.hydrate();
    const second = tracker.hydrate();
    resolvers[1]!({});
    await second;
    const identity = {
      patientId,
      prescriptionId: prescription.id,
      medicineId,
      date,
      timing: 'morning' as const,
    };
    resolvers[0]!({
      [doseKey(identity)]: {
        ...identity,
        takenAt: new Date(now).toISOString(),
      },
    });
    await first;
    expect(tracker.getSnapshot().records).toEqual({});
  });
  it('rejects future dates, expired medicines and unscheduled times', async () => {
    const { tracker, storage } = setup();
    await tracker.hydrate();
    await tracker.toggle(prescription, medicineId, '2026-10-14', 'morning');
    await tracker.toggle(prescription, medicineId, '2026-10-11', 'morning');
    await tracker.toggle(prescription, 'vitamin-c', date, 'night');
    await tracker.toggle(prescription, 'missing', date, 'morning');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(
      scheduledDoses(prescription, '2026-10-19').map(item => item.medicine.id),
    ).toEqual(['vitamin-c', 'multivitamin']);
    expect(scheduledDoses(prescription, '2026-10-26')).toEqual([]);
  });
  it('gives the next clinic date fresh tracking while preserving yesterday’s history', async () => {
    const { tracker, repository } = setup();
    await tracker.hydrate();
    await tracker.toggle(prescription, medicineId, date, 'morning');
    const nextDay = new DoseTracker(patientId, repository, () =>
      Date.parse('2026-10-13T19:00:00Z'),
    );
    await nextDay.hydrate();
    expect(
      doseProgress(
        prescription,
        '2026-10-14',
        patientId,
        nextDay.getSnapshot().records,
      ).taken,
    ).toBe(0);
    expect(
      doseProgress(prescription, date, patientId, nextDay.getSnapshot().records)
        .taken,
    ).toBe(1);
    await nextDay.toggle(prescription, medicineId, '2026-10-14', 'morning');
    expect(Object.keys(nextDay.getSnapshot().records)).toHaveLength(2);
  });
});
