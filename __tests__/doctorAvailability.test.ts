import { defaultMockSettings } from '../src/api/mockApi';
import {
  availabilityLabel,
  nextAvailableSlot,
} from '../src/features/home/availability';
import type { Slot } from '../src/features/booking/contracts';

const now = Date.parse('2026-10-13T04:00:00Z');
const slot = (
  date: string,
  time: string,
  available = true,
  doctorId = 'ananya',
): Slot => ({
  id: `${date}-${time}`,
  doctorId,
  startsAt: `${date}T${time}:00+05:30`,
  endsAt: `${date}T${time}:30+05:30`,
  available,
});
describe('doctor next-slot summaries', () => {
  it('uses the earliest future available slot for this doctor, ignoring taken and past times', async () => {
    const api = {
      getSlots: jest.fn(async () => [
        slot('2026-10-13', '11:00'),
        slot('2026-10-13', '09:00'),
        slot('2026-10-13', '10:00', false),
        slot('2026-10-13', '09:45', true, 'arjun'),
      ]),
    };
    const next = await nextAvailableSlot(
      api,
      'ananya',
      defaultMockSettings,
      undefined,
      () => now,
    );
    expect(next?.id).toBe('2026-10-13-11:00');
    expect(api.getSlots).toHaveBeenCalledTimes(1);
    expect(
      availabilityLabel({ status: 'ready', slot: next }, '2026-10-13'),
    ).toMatch(/Next: Today.*11:00/);
  });
  it('searches the next date when today is full and stops after the booking horizon when empty', async () => {
    const api = {
      getSlots: jest.fn(async (_id: string, date: string) =>
        date === '2026-10-14' ? [slot(date, '09:00')] : [],
      ),
    };
    expect(
      (
        await nextAvailableSlot(
          api,
          'ananya',
          defaultMockSettings,
          undefined,
          () => now,
        )
      )?.id,
    ).toBe('2026-10-14-09:00');
    expect(api.getSlots).toHaveBeenCalledTimes(2);
    const empty = { getSlots: jest.fn(async () => []) };
    await expect(
      nextAvailableSlot(
        empty,
        'ananya',
        defaultMockSettings,
        undefined,
        () => now,
      ),
    ).resolves.toBeNull();
    expect(empty.getSlots).toHaveBeenCalledTimes(14);
    expect(availabilityLabel({ status: 'empty', slot: null })).toBe(
      'No slots in the next 14 days',
    );
  });
  it('never publishes a late response after cancellation or a fake fallback slot after an error', async () => {
    const controller = new AbortController();
    const api = {
      getSlots: async () => {
        controller.abort();
        return [slot('2026-10-13', '11:00')];
      },
    };
    await expect(
      nextAvailableSlot(
        api,
        'ananya',
        defaultMockSettings,
        controller.signal,
        () => now,
      ),
    ).resolves.toBeNull();
    expect(availabilityLabel({ status: 'error', slot: null })).toBe(
      'Choose a time to check availability',
    );
  });
});
