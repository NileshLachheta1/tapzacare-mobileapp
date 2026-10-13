import everyday from '../mocks/everyday.json';
import diwali from '../mocks/diwali.json';
import doctors from '../mocks/doctors.json';
import prescriptions from '../mocks/prescriptions.json';
import {
  prescriptionsSchema,
  type Prescription,
} from '../features/prescriptions/contracts';
import {
  doctorSchema,
  type ConfigVariant,
  type Doctor,
} from '../config/schema';
import { z } from 'zod';
import {
  bookingRequestSchema,
  type BookingResponse,
  type Slot,
} from '../features/booking/contracts';
import { clinicDate, isDateKey } from '../features/booking/dates';

export type MockSettings = {
  latencyMs: number;
  failConfig: boolean;
  failDoctors: boolean;
  emptyLists: boolean;
  failSlots: boolean;
  emptySlots: boolean;
  bookingOutcome: 'success' | 'error' | 'conflict';
  failPrescriptions: boolean;
  emptyPrescriptions: boolean;
  failDoseSave: boolean;
};
export const defaultMockSettings: MockSettings = {
  latencyMs: 350,
  failConfig: false,
  failDoctors: false,
  emptyLists: false,
  failSlots: false,
  emptySlots: false,
  bookingOutcome: 'success',
  failPrescriptions: false,
  emptyPrescriptions: false,
  failDoseSave: false,
};
export function bundledConfig(variant: ConfigVariant): unknown {
  return variant === 'everyday' ? everyday : diwali;
}

export class MockApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
  ) {
    super(`Mock ${endpoint} returned ${status}`);
    this.name = 'MockApiError';
  }
}
export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}
function aborted() {
  const error = new Error('Request cancelled');
  error.name = 'AbortError';
  return error;
}
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(aborted());
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(aborted());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
const slotCatalog = new Map<string, Slot>();
const reservedSlots = new Set<string>();
let bookingSequence = 0;
const clinicTimes = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
];
/** Test isolation; reservations otherwise last for this mock server's session. */
export function resetMockBookings() {
  slotCatalog.clear();
  reservedSlots.clear();
  bookingSequence = 0;
}
export const mockApi = {
  async getPrescriptions(
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<Prescription[]> {
    await delay(settings.latencyMs, signal);
    if (settings.failPrescriptions) {
      throw new MockApiError('GET /prescriptions', 503);
    }
    return settings.emptyLists || settings.emptyPrescriptions
      ? []
      : prescriptionsSchema.parse(prescriptions);
  },
  async getConfig(
    variant: ConfigVariant,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<unknown> {
    await delay(settings.latencyMs, signal);
    if (settings.failConfig) {
      throw new MockApiError('GET /config', 503);
    }
    const raw = JSON.parse(JSON.stringify(bundledConfig(variant))) as Record<
      string,
      unknown
    >;
    if (settings.emptyLists) {
      raw.sections = [];
    }
    return raw;
  },
  async getDoctors(
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<Doctor[]> {
    await delay(settings.latencyMs, signal);
    if (settings.failDoctors) {
      throw new MockApiError('GET /doctors', 503);
    }
    return settings.emptyLists ? [] : z.array(doctorSchema).parse(doctors);
  },
  async getSlots(
    doctorId: string,
    date: string,
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<Slot[]> {
    await delay(settings.latencyMs, signal);
    if (settings.failSlots) {
      throw new MockApiError('GET /slots', 503);
    }
    if (!doctors.some(doctor => doctor.id === doctorId)) {
      throw new MockApiError('GET /slots', 404);
    }
    if (!isDateKey(date) || date < clinicDate()) {
      throw new MockApiError('GET /slots', 400);
    }
    if (settings.emptySlots) {
      return [];
    }
    return clinicTimes.map((time, index) => {
      const startsAt = new Date(`${date}T${time}:00+05:30`).toISOString();
      const slot: Slot = {
        id: `${doctorId}_${date}_${time}`,
        doctorId,
        startsAt,
        endsAt: new Date(
          new Date(startsAt).getTime() + 30 * 60 * 1000,
        ).toISOString(),
        available:
          index !== 2 &&
          !reservedSlots.has(`${doctorId}_${date}_${time}`) &&
          new Date(startsAt).getTime() > Date.now(),
      };
      slotCatalog.set(slot.id, slot);
      return slot;
    });
  },
  async postBooking(
    body: { doctorId: string; slotId: string },
    settings: MockSettings,
    signal?: AbortSignal,
  ): Promise<BookingResponse> {
    await delay(settings.latencyMs, signal);
    const request = bookingRequestSchema.safeParse(body);
    if (!request.success) {
      throw new MockApiError('POST /bookings', 400);
    }
    const slot = slotCatalog.get(request.data.slotId);
    if (!slot) {
      throw new MockApiError('POST /bookings', 404);
    }
    if (slot.doctorId !== request.data.doctorId) {
      throw new MockApiError('POST /bookings', 400);
    }
    if (settings.bookingOutcome === 'error') {
      throw new MockApiError('POST /bookings', 503);
    }
    if (settings.bookingOutcome === 'conflict') {
      reservedSlots.add(slot.id);
    }
    if (
      !slot.available ||
      reservedSlots.has(slot.id) ||
      new Date(slot.startsAt).getTime() <= Date.now()
    ) {
      throw new MockApiError('POST /bookings', 409);
    }
    // Check and reserve together after the async delay: concurrent posts cannot both win.
    reservedSlots.add(slot.id);
    return {
      status: 201,
      data: {
        id: `tapza-${++bookingSequence}`,
        doctorId: slot.doctorId,
        slotId: slot.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: 'confirmed',
      },
    };
  },
};
