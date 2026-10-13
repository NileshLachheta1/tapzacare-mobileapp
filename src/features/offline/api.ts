import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { mockApi, MockApiError } from '../../api/mockApi';
import { doctorSchema } from '../../config/schema';
import { slotSchema, bookingSchema } from '../booking/contracts';
import { clinicDate } from '../booking/dates';
import type { BookingApi } from '../booking/controller';
import type { QueueItem } from './Queue';
import type { MockSettings } from '../../api/mockApi';
let connected = false;
let simulated = false;
export const isOnline = () => connected && !simulated;
export const setConnected = (value: boolean) => {
  connected = value;
};
export const setSimulated = (value: boolean) => {
  simulated = value;
};
async function cache<T>(
  key: string,
  schema: z.ZodType<T>,
  fetch: () => Promise<T>,
): Promise<T> {
  if (!isOnline()) {
    const raw = await AsyncStorage.getItem(key);
    if (!raw)
      throw new Error('No cached availability. Connect to load times first.');
    return schema.parse(JSON.parse(raw));
  }
  const data = await fetch();
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* Online browsing works without cache. */
  }
  return data;
}
export const bookingApi: BookingApi = {
  getDoctors: (settings, signal) =>
    cache('tapza.doctors.v1', z.array(doctorSchema), () =>
      mockApi.getDoctors(settings, signal),
    ),
  getSlots: (id, date, settings, signal) =>
    cache(`tapza.slots.v1.${id}.${date}`, z.array(slotSchema), () =>
      mockApi.getSlots(id, date, settings, signal),
    ),
  postBooking: (body, settings, signal) => {
    if (!isOnline()) return Promise.reject(new Error('Offline'));
    return mockApi.postBooking(body, settings, signal);
  },
};
// The in-process demo server persists queue receipts. A real server must provide an
// idempotency key (e.g. request header), retaining the exact two-field POST body.
export async function submitQueued(item: QueueItem, settings: MockSettings) {
  const key = `tapza.receipt.v1.${item.id}`;
  const saved = await AsyncStorage.getItem(key);
  if (saved) return bookingSchema.parse(JSON.parse(saved));
  if (!isOnline()) throw new Error('Offline');
  if (Date.parse(item.slot.startsAt) <= Date.now())
    throw new MockApiError('POST /bookings', 409);
  await bookingApi.getSlots(
    item.doctor.id,
    clinicDate(new Date(item.slot.startsAt)),
    settings,
  );
  const response = await bookingApi.postBooking(
    { doctorId: item.doctor.id, slotId: item.slot.id },
    settings,
  );
  const booking = bookingSchema.parse(response.data);
  await AsyncStorage.setItem(key, JSON.stringify(booking));
  return booking;
}
