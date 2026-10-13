import { z } from 'zod';
import type { MockSettings } from '../../api/mockApi';
import { slotSchema, type Slot } from '../booking/contracts';
import {
  canBookSlot,
  clinicDate,
  dateChoices,
  formatDate,
  formatSlotTime,
} from '../booking/dates';

type SlotsApi = {
  getSlots(
    doctorId: string,
    date: string,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<Slot[]>;
};
export type DoctorAvailability = {
  status: 'loading' | 'ready' | 'empty' | 'error';
  slot: Slot | null;
};
export async function nextAvailableSlot(
  api: SlotsApi,
  doctorId: string,
  settings: MockSettings,
  signal?: AbortSignal,
  now: () => number = Date.now,
): Promise<Slot | null> {
  for (const date of dateChoices(now())) {
    if (signal?.aborted) {
      return null;
    }
    const slots = z
      .array(slotSchema)
      .parse(await api.getSlots(doctorId, date, settings, signal));
    if (signal?.aborted) {
      return null;
    }
    const first = slots
      .filter(slot => canBookSlot(slot, doctorId, date, now()))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
    if (first) {
      return first;
    }
  }
  return null;
}
export function availabilityLabel(
  availability: DoctorAvailability | undefined,
  today = clinicDate(),
): string {
  if (!availability || availability.status === 'loading') {
    return 'Checking available times…';
  }
  if (availability.status === 'error') {
    return 'Choose a time to check availability';
  }
  if (!availability.slot) {
    return 'No slots in the next 14 days';
  }
  const date = clinicDate(new Date(availability.slot.startsAt));
  return `Next: ${
    date === today ? 'Today' : formatDate(date)
  } · ${formatSlotTime(availability.slot.startsAt)} IST`;
}
