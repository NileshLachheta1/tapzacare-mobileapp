import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { KeyValueStorage } from './configRepository';
import { isDateKey } from '../features/booking/dates';
import {
  doseTimingSchema,
  type DoseRecords,
} from '../features/prescriptions/contracts';
import { doseKey } from '../features/prescriptions/schedule';

const text = z.string().min(1);
const recordSchema = z.object({
  patientId: text,
  prescriptionId: text,
  medicineId: text,
  date: z.string().refine(isDateKey),
  timing: doseTimingSchema,
  takenAt: z.iso.datetime({ offset: true }),
});
const savedSchema = z.object({
  version: z.literal(1),
  entries: z.array(recordSchema),
});
export const doseStorageKey = (patientId: string) =>
  `tapza.doses.v1.${encodeURIComponent(patientId)}`;
export class DoseRepository {
  constructor(
    private readonly storage: KeyValueStorage = AsyncStorage,
    private readonly failSave: () => boolean = () => false,
  ) {}
  async load(patientId: string): Promise<DoseRecords> {
    const raw = await this.storage.getItem(doseStorageKey(patientId));
    if (!raw) {
      return {};
    }
    const saved = savedSchema.parse(JSON.parse(raw));
    const records: DoseRecords = {};
    for (const entry of saved.entries) {
      const key = doseKey(entry);
      if (entry.patientId !== patientId || records[key]) {
        throw new Error('Invalid saved dose scope');
      }
      records[key] = entry;
    }
    return records;
  }
  async save(patientId: string, records: DoseRecords): Promise<void> {
    if (this.failSave()) {
      throw new Error('Mock dose storage failure');
    }
    const payload = savedSchema.parse({
      version: 1,
      entries: Object.values(records),
    });
    if (payload.entries.some(entry => entry.patientId !== patientId)) {
      throw new Error('Invalid dose patient');
    }
    await this.storage.setItem(
      doseStorageKey(patientId),
      JSON.stringify(payload),
    );
  }
}
