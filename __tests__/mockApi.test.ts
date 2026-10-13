import {
  defaultMockSettings,
  mockApi,
  resetMockBookings,
} from '../src/api/mockApi';
import { addClinicDays, clinicDate } from '../src/features/booking/dates';
import { parseConfig } from '../src/config/schema';

describe('mock transport', () => {
  beforeEach(() => resetMockBookings());
  it('returns independent config responses, both layouts and an empty-list scenario', async () => {
    const settings = { ...defaultMockSettings, latencyMs: 0 };
    const normal = parseConfig(await mockApi.getConfig('everyday', settings));
    const festival = parseConfig(await mockApi.getConfig('diwali', settings));
    expect(normal.theme.primary).not.toBe(festival.theme.primary);
    const empty = parseConfig(
      await mockApi.getConfig('everyday', { ...settings, emptyLists: true }),
    );
    expect(empty.sections).toHaveLength(0);
    expect(normal.sections).toHaveLength(6);
  });
  it('returns prescriptions with scoped empty/failure scenarios and abortable loading', async () => {
    const settings = { ...defaultMockSettings, latencyMs: 0 };
    expect(await mockApi.getPrescriptions(settings)).toHaveLength(2);
    await expect(
      mockApi.getPrescriptions({ ...settings, emptyPrescriptions: true }),
    ).resolves.toEqual([]);
    await expect(
      mockApi.getPrescriptions({ ...settings, failPrescriptions: true }),
    ).rejects.toMatchObject({ status: 503 });
    const controller = new AbortController();
    const pending = mockApi.getPrescriptions(
      { ...settings, latencyMs: 60000 },
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('provides forced failures without breaking unrelated endpoints', async () => {
    const settings = { ...defaultMockSettings, latencyMs: 0, failConfig: true };
    await expect(mockApi.getConfig('everyday', settings)).rejects.toMatchObject(
      { status: 503 },
    );
    await expect(mockApi.getDoctors(settings)).resolves.toHaveLength(2);
  });
  it('aborts a slow request promptly', async () => {
    const controller = new AbortController();
    const request = mockApi.getConfig(
      'everyday',
      { ...defaultMockSettings, latencyMs: 60000 },
      controller.signal,
    );
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('atomically reserves a slot and returns 409 to a concurrent second confirmation', async () => {
    const settings = { ...defaultMockSettings, latencyMs: 0 };
    const date = addClinicDays(clinicDate(), 1);
    const slots = await mockApi.getSlots('ananya', date, settings);
    const slot = slots.find(item => item.available)!;
    const body = { doctorId: 'ananya', slotId: slot.id };
    const responses = await Promise.allSettled([
      mockApi.postBooking(body, settings),
      mockApi.postBooking(body, settings),
    ]);
    expect(
      responses.filter(response => response.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(responses).toContainEqual(
      expect.objectContaining({
        status: 'rejected',
        reason: expect.objectContaining({ status: 409 }),
      }),
    );
    expect(
      (await mockApi.getSlots('ananya', date, settings)).find(
        item => item.id === slot.id,
      )?.available,
    ).toBe(false);
  });
  it('rejects mismatched doctors, invalid bodies and taken slots without reserving a valid appointment', async () => {
    const settings = { ...defaultMockSettings, latencyMs: 0 };
    const slots = await mockApi.getSlots(
      'ananya',
      addClinicDays(clinicDate(), 1),
      settings,
    );
    const slot = slots.find(item => item.available)!;
    await expect(
      mockApi.postBooking({ doctorId: 'arjun', slotId: slot.id }, settings),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      mockApi.postBooking({ doctorId: '', slotId: slot.id }, settings),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      mockApi.postBooking(
        { doctorId: 'ananya', slotId: slot.id },
        { ...settings, bookingOutcome: 'error' },
      ),
    ).rejects.toMatchObject({ status: 503 });
    await expect(
      mockApi.postBooking({ doctorId: 'ananya', slotId: slot.id }, settings),
    ).resolves.toMatchObject({ status: 201 });
  });
});
