import { z } from 'zod';
import {
  defaultMockSettings,
  mockApi,
  resetMockBookings,
  type MockSettings,
} from '../src/api/mockApi';
import {
  doctorSchema,
  parseConfig,
  type SectionOf,
} from '../src/config/schema';
import doctors from '../src/mocks/doctors.json';
import everyday from '../src/mocks/everyday.json';
import {
  BookingController,
  type BookingApi,
} from '../src/features/booking/controller';
import type { Slot } from '../src/features/booking/contracts';
import { addClinicDays, clinicDate } from '../src/features/booking/dates';

const doctor = z.array(doctorSchema).parse(doctors)[0]!;
const services = parseConfig(everyday).sections.find(
  (section): section is SectionOf<'service_grid'> =>
    section.type === 'service_grid',
)!;
const service = services.items[0]!;
function setup(api: BookingApi = mockApi) {
  let settings: MockSettings = { ...defaultMockSettings, latencyMs: 20 };
  const controller = new BookingController({
    api,
    settings: () => settings,
    consumeConfirmationSettings: () => {
      const snapshot = settings;
      settings = { ...settings, bookingOutcome: 'success' };
      return snapshot;
    },
  });
  return {
    controller,
    setSettings: (patch: Partial<MockSettings>) => {
      settings = { ...settings, ...patch };
    },
  };
}
async function ready(controller: BookingController) {
  controller.openDoctor(doctor);
  await jest.runAllTimersAsync();
  const slot = controller
    .getSnapshot()
    .flow.slots.find(item => item.available)!;
  controller.selectSlot(slot.id);
  return slot;
}
describe('booking transaction', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-13T02:00:00Z'));
    resetMockBookings();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  it('adds a pending appointment immediately, blocks double confirmation and dismissal, then reconciles a 201', async () => {
    const post = jest.spyOn(mockApi, 'postBooking');
    const { controller } = setup();
    const slot = await ready(controller);
    const confirming = controller.confirm();
    expect(controller.getSnapshot().appointments).toEqual([
      expect.objectContaining({
        id: 'pending-1',
        status: 'pending',
        booking: null,
      }),
    ]);
    expect(controller.close()).toBe(false);
    await controller.confirm();
    controller.selectDate(addClinicDays(clinicDate(), 1));
    controller.openDoctor(doctor);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]?.[0]).toEqual({
      doctorId: doctor.id,
      slotId: slot.id,
    });
    await jest.runAllTimersAsync();
    await confirming;
    expect(controller.getSnapshot().flow.confirmation).toBe('success');
    expect(controller.getSnapshot().appointments).toEqual([
      expect.objectContaining({
        id: 'tapza-1',
        status: 'confirmed',
        booking: expect.objectContaining({ slotId: slot.id }),
      }),
    ]);
    expect(controller.close()).toBe(true);
    expect(controller.getSnapshot().appointments).toHaveLength(1);
  });
  it('rolls back a failed confirmation, keeps the selection and supports one successful retry', async () => {
    const { controller, setSettings } = setup();
    const slot = await ready(controller);
    setSettings({ bookingOutcome: 'error' });
    const failing = controller.confirm();
    await jest.runAllTimersAsync();
    await failing;
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    expect(controller.getSnapshot().flow).toMatchObject({
      confirmation: 'error',
      selectedSlotId: slot.id,
    });
    const retry = controller.confirm();
    await jest.runAllTimersAsync();
    await retry;
    expect(controller.getSnapshot().appointments).toHaveLength(1);
    expect(controller.getSnapshot().flow.confirmation).toBe('success');
  });
  it('rolls back 409, preserves the doctor/date, refreshes availability and requires a new choice', async () => {
    const { controller, setSettings } = setup();
    const slot = await ready(controller);
    const date = controller.getSnapshot().flow.date;
    setSettings({ bookingOutcome: 'conflict' });
    const conflicting = controller.confirm();
    await jest.runAllTimersAsync();
    await conflicting;
    const state = controller.getSnapshot();
    expect(state.appointments).toHaveLength(0);
    expect(state.flow).toMatchObject({
      confirmation: 'conflict',
      date,
      selectedSlotId: null,
      target: { doctorId: doctor.id },
    });
    expect(state.flow.slots.find(item => item.id === slot.id)?.available).toBe(
      false,
    );
    await controller.confirm();
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    const replacement = state.flow.slots.find(item => item.available)!;
    controller.selectSlot(replacement.id);
    const retry = controller.confirm();
    await jest.runAllTimersAsync();
    await retry;
    expect(controller.getSnapshot().flow.confirmed?.slot.id).toBe(
      replacement.id,
    );
  });
  it('books a service with its configured provider and service price while sending only doctorId/slotId', async () => {
    const post = jest.spyOn(mockApi, 'postBooking');
    const { controller } = setup();
    controller.openService(service);
    expect(controller.getSnapshot().flow.providerStatus).toBe('loading');
    await jest.runAllTimersAsync();
    const slot = controller
      .getSnapshot()
      .flow.slots.find(item => item.available)!;
    controller.selectSlot(slot.id);
    const confirming = controller.confirm();
    expect(controller.getSnapshot().appointments[0]).toMatchObject({
      service,
      feeInr: service.priceInr,
      doctor: { id: service.doctorId },
    });
    await jest.runAllTimersAsync();
    await confirming;
    expect(post.mock.calls[0]?.[0]).toEqual({
      doctorId: service.doctorId,
      slotId: slot.id,
    });
  });
  it('exposes loading, empty and error states and recovers on a slot retry', async () => {
    const { controller, setSettings } = setup();
    setSettings({ failSlots: true });
    controller.openDoctor(doctor);
    expect(controller.getSnapshot().flow.slotStatus).toBe('loading');
    await jest.runAllTimersAsync();
    expect(controller.getSnapshot().flow.slotStatus).toBe('error');
    setSettings({ failSlots: false, emptySlots: true });
    const empty = controller.refreshSlots();
    await jest.runAllTimersAsync();
    await empty;
    expect(controller.getSnapshot().flow.slotStatus).toBe('empty');
    setSettings({ emptySlots: false });
    const retry = controller.refreshSlots();
    await jest.runAllTimersAsync();
    await retry;
    expect(controller.getSnapshot().flow.slotStatus).toBe('ready');
  });
  it('lets an unavailable service provider retry before confirmation', async () => {
    const { controller, setSettings } = setup();
    setSettings({ failDoctors: true });
    controller.openService(service);
    await jest.runAllTimersAsync();
    expect(controller.getSnapshot().flow.providerStatus).toBe('error');
    controller.selectSlot(
      controller.getSnapshot().flow.slots.find(item => item.available)!.id,
    );
    await controller.confirm();
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    setSettings({ failDoctors: false });
    const retry = controller.retryProvider();
    await jest.runAllTimersAsync();
    await retry;
    expect(controller.getSnapshot().flow.providerStatus).toBe('ready');
  });
  it('ignores stale date responses even when a transport fails to honor cancellation', async () => {
    const requests: { date: string; resolve(value: Slot[]): void }[] = [];
    const api: BookingApi = {
      ...mockApi,
      getSlots: jest.fn(
        (_id, date) => new Promise(resolve => requests.push({ date, resolve })),
      ),
    };
    const { controller } = setup(api);
    controller.openDoctor(doctor);
    const tomorrow = addClinicDays(clinicDate(), 1);
    controller.selectDate(tomorrow);
    const makeSlot = (date: string): Slot => ({
      id: date,
      doctorId: doctor.id,
      startsAt: `${date}T09:00:00+05:30`,
      endsAt: `${date}T09:30:00+05:30`,
      available: true,
    });
    requests[1]!.resolve([makeSlot(tomorrow)]);
    await Promise.resolve();
    await Promise.resolve();
    requests[0]!.resolve([makeSlot(clinicDate())]);
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.getSnapshot().flow).toMatchObject({
      date: tomorrow,
      slots: [expect.objectContaining({ id: tomorrow })],
    });
    controller.close();
  });
  it('clears selection on date changes and rejects taken slots and past dates', async () => {
    const { controller } = setup();
    const slot = await ready(controller);
    const tomorrow = addClinicDays(clinicDate(), 1);
    controller.selectDate(tomorrow);
    expect(controller.getSnapshot().flow.selectedSlotId).toBeNull();
    controller.selectSlot(slot.id);
    expect(controller.getSnapshot().flow.selectedSlotId).toBeNull();
    await jest.runAllTimersAsync();
    const taken = controller
      .getSnapshot()
      .flow.slots.find(item => !item.available)!;
    controller.selectSlot(taken.id);
    expect(controller.getSnapshot().flow.selectedSlotId).toBeNull();
    controller.selectDate('2026-10-12');
    expect(controller.getSnapshot().flow.date).toBe(tomorrow);
  });
  it('rolls back a malformed confirmation response instead of showing success', async () => {
    const { controller } = setup({
      ...mockApi,
      postBooking: async () => ({
        status: 201,
        data: {
          id: 'invalid',
          doctorId: 'someone-else',
          slotId: 'other',
          startsAt: 'bad',
          endsAt: 'bad',
          status: 'confirmed',
        },
      }),
    });
    await ready(controller);
    await controller.confirm();
    expect(controller.getSnapshot().flow.confirmation).toBe('error');
    expect(controller.getSnapshot().appointments).toHaveLength(0);
  });
  it('recovers when the availability refresh itself fails after a conflict', async () => {
    const { controller, setSettings } = setup();
    const slot = await ready(controller);
    setSettings({ bookingOutcome: 'conflict', failSlots: true });
    const confirming = controller.confirm();
    await jest.runAllTimersAsync();
    await confirming;
    expect(controller.getSnapshot().flow).toMatchObject({
      confirmation: 'conflict',
      slotStatus: 'error',
      selectedSlotId: null,
    });
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    setSettings({ failSlots: false });
    const retry = controller.refreshSlots();
    await jest.runAllTimersAsync();
    await retry;
    expect(
      controller.getSnapshot().flow.slots.find(item => item.id === slot.id)
        ?.available,
    ).toBe(false);
    controller.selectSlot(
      controller.getSnapshot().flow.slots.find(item => item.available)!.id,
    );
    const second = controller.confirm();
    await jest.runAllTimersAsync();
    await second;
    expect(controller.getSnapshot().flow.confirmation).toBe('success');
  });
  it('refreshes an expired selection before posting a booking', async () => {
    const post = jest.spyOn(mockApi, 'postBooking');
    const { controller } = setup();
    const slot = await ready(controller);
    jest.setSystemTime(new Date(slot.startsAt));
    await controller.confirm();
    await jest.runAllTimersAsync();
    expect(post).not.toHaveBeenCalled();
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    expect(controller.getSnapshot().flow.selectedSlotId).toBeNull();
    expect(
      controller.getSnapshot().flow.slots.find(item => item.id === slot.id)
        ?.available,
    ).toBe(false);
  });
  it('cancels pending work on teardown and leaves no optimistic ghost appointment', async () => {
    const { controller } = setup();
    await ready(controller);
    const confirming = controller.confirm();
    controller.dispose();
    await confirming;
    expect(controller.getSnapshot().appointments).toHaveLength(0);
    expect(controller.getSnapshot().flow.target).toBeNull();
  });
});
