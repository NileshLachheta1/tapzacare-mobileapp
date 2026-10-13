import { clinicDate } from '../booking/dates';
import type { DoseRecords, DoseTiming, Prescription } from './contracts';
import { doseKey, isMedicineScheduled } from './schedule';

export interface DoseStorage {
  load(patientId: string): Promise<DoseRecords>;
  save(patientId: string, records: DoseRecords): Promise<void>;
}
type DoseState = {
  status: 'loading' | 'ready' | 'error';
  records: DoseRecords;
  saving: string[];
  errors: string[];
};
/** Serialize local writes and publish taken/undo only once persistence succeeds. */
export class DoseTracker {
  private state: DoseState = {
    status: 'loading',
    records: {},
    saving: [],
    errors: [],
  };
  private listeners = new Set<() => void>();
  private hydration = 0;
  private queue: Promise<void> = Promise.resolve();
  constructor(
    public readonly patientId: string,
    private readonly storage: DoseStorage,
    private readonly now: () => number = Date.now,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<DoseState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  hydrate = async () => {
    if (this.state.saving.length) {
      return;
    }
    const sequence = ++this.hydration;
    this.update({ status: 'loading' });
    try {
      const records = await this.storage.load(this.patientId);
      if (sequence === this.hydration) {
        this.update({ status: 'ready', records });
      }
    } catch {
      if (sequence === this.hydration) {
        this.update({ status: 'error' });
      }
    }
  };
  toggle = (
    prescription: Prescription,
    medicineId: string,
    date: string,
    timing: DoseTiming,
  ): Promise<void> => {
    const medicine = prescription.medicines.find(
      item => item.id === medicineId,
    );
    if (
      this.state.status !== 'ready' ||
      !medicine ||
      !medicine.timing.includes(timing) ||
      !isMedicineScheduled(prescription, medicine, date) ||
      date > clinicDate(this.now())
    ) {
      return Promise.resolve();
    }
    const identity = {
      patientId: this.patientId,
      prescriptionId: prescription.id,
      medicineId,
      date,
      timing,
    };
    const key = doseKey(identity);
    if (this.state.saving.includes(key)) {
      return Promise.resolve();
    }
    const taken = !this.state.records[key];
    this.update({
      saving: [...this.state.saving, key],
      errors: this.state.errors.filter(item => item !== key),
    });
    const task = this.queue.then(async () => {
      const next = { ...this.state.records };
      if (taken) {
        next[key] = {
          ...identity,
          takenAt: new Date(this.now()).toISOString(),
        };
      } else {
        delete next[key];
      }
      try {
        await this.storage.save(this.patientId, next);
        this.update({ records: next });
      } catch {
        this.update({
          errors: [...this.state.errors.filter(item => item !== key), key],
        });
      } finally {
        this.update({ saving: this.state.saving.filter(item => item !== key) });
      }
    });
    this.queue = task;
    return task;
  };
}
