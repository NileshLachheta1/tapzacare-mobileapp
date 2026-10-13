import { OfflineQueue, type QueueItem } from '../src/features/offline/Queue';
import { MockApiError, bundledConfig } from '../src/api/mockApi';
import { parseConfig } from '../src/config/schema';
import { applyAppearance } from '../src/config/appearance';
import { parseCareLink } from '../src/navigation/deepLinks';
import { translate } from '../src/i18n';
import { planReminders } from '../src/features/reminders/planner';
import { doseKey } from '../src/features/prescriptions/schedule';
import type { Appointment, Booking } from '../src/features/booking/contracts';
const appointment: Appointment = {
  id: 'pending-test',
  status: 'pending',
  doctor: {
    id: 'ananya',
    name: 'Doctor',
    specialty: 'General',
    photoUrl: 'asset://doctor',
    feeInr: 500,
    languages: ['Hindi'],
  },
  service: null,
  slot: {
    id: 'slot',
    doctorId: 'ananya',
    startsAt: '2026-10-14T03:30:00Z',
    endsAt: '2026-10-14T04:00:00Z',
    available: true,
  },
  feeInr: 500,
  booking: null,
};
const accepted: Booking = {
  id: 'accepted',
  doctorId: 'ananya',
  slotId: 'slot',
  startsAt: appointment.slot.startsAt,
  endsAt: appointment.slot.endsAt,
  status: 'confirmed',
};
function store() {
  let saved: string | null = null;
  return {
    getItem: jest.fn(async () => saved),
    setItem: jest.fn(async (_key: string, value: string) => {
      saved = value;
    }),
  };
}
describe('bonus behaviour', () => {
  it('persists offline requests, restores them, and only syncs once online', async () => {
    const storage = store();
    let online = false;
    const submit = jest.fn(async () => accepted);
    const q = new OfflineQueue(storage, submit, () => online);
    await q.hydrate();
    await q.enqueue(appointment);
    await q.sync();
    expect(submit).not.toHaveBeenCalled();
    const restored = new OfflineQueue(storage, submit, () => online);
    await restored.hydrate();
    expect(restored.getSnapshot().items[0]?.status).toBe('queued');
    online = true;
    await Promise.all([restored.sync(), restored.sync()]);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(restored.getSnapshot().items[0]?.status).toBe('confirmed');
    await restored.sync();
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it('rejects duplicate queued slots and leaves conflicts for user reselection', async () => {
    const q = new OfflineQueue(
      store(),
      async () => {
        throw new MockApiError('POST', 409);
      },
      () => true,
    );
    await q.hydrate();
    await q.enqueue(appointment);
    await expect(q.enqueue(appointment)).rejects.toThrow();
    await q.sync();
    expect(q.getSnapshot().items[0]?.status).toBe('conflict');
    await q.sync(true);
    expect(q.getSnapshot().items[0]?.status).toBe('conflict');
  });
  it('does not claim a queue write succeeded when storage fails', async () => {
    const storage = store();
    const q = new OfflineQueue(
      storage,
      async () => accepted,
      () => false,
    );
    await q.hydrate();
    storage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(q.enqueue(appointment)).rejects.toThrow();
    expect(q.getSnapshot().items).toEqual([]);
    expect(q.getSnapshot().error).toContain('Could not save');
  });
  it('makes transient sync errors retryable without dropping a request', async () => {
    const submit = jest
      .fn<Promise<Booking>, [QueueItem]>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(accepted);
    const q = new OfflineQueue(store(), submit, () => true);
    await q.hydrate();
    await q.enqueue(appointment);
    await q.sync();
    expect(q.getSnapshot().items[0]?.status).toBe('error');
    await q.sync(true);
    expect(q.getSnapshot().items[0]?.booking?.id).toBe('accepted');
  });
  it('validates deep links without accepting unrelated URLs or path injection', () => {
    expect(parseCareLink('tapzacare://doctor/ananya')).toEqual({
      kind: 'doctor',
      id: 'ananya',
    });
    expect(parseCareLink('tapzacare://prescription/rx-family-care')).toEqual({
      kind: 'prescription',
      id: 'rx-family-care',
    });
    for (const url of [
      'https://evil.test/doctor/ananya',
      'tapzacare://doctor/%2F..',
      'tapzacare://doctor/',
      'tapzacare://doctor/a?x=1',
    ])
      expect(parseCareLink(url)).toBeNull();
  });
  it('applies a config-defined dark palette and backgrounds without mutating light mode', () => {
    const config = parseConfig(bundledConfig('everyday'));
    const dark = applyAppearance(config, true);
    expect(dark.theme.mode).toBe('dark');
    expect(dark.theme.background).toBe(config.darkTheme?.background);
    expect(dark.sections[0]?.background).toEqual(
      config.darkBackgrounds?.[config.sections[0]!.id],
    );
    expect(config.theme.mode).toBe('light');
    expect(applyAppearance(config, false)).toBe(config);
  });
  it('translates navigation, key actions and interpolated progress into Hindi', () => {
    expect(translate('Medicines', 'hi')).toBe('दवाइयाँ');
    expect(translate('Confirm booking', 'hi')).toBe('बुकिंग की पुष्टि करें');
    expect(translate('2 of 5 doses taken today', 'hi')).toBe(
      '5 में से 2 खुराक ली गई',
    );
    expect(translate('Dr. Ananya Reddy', 'hi')).toBe('Dr. Ananya Reddy');
  });
  it('schedules only future untaken doses within the course and seven-day horizon', () => {
    const rx = {
      id: 'rx',
      issuedAt: '2026-10-13',
      doctorName: 'Doctor',
      clinicName: 'Clinic',
      medicines: [
        {
          id: 'm',
          name: 'Demo',
          dose: '1 tablet',
          days: 2,
          timing: ['morning', 'night'] as ('morning' | 'night')[],
        },
      ],
    };
    const identity = {
      patientId: 'p',
      prescriptionId: 'rx',
      medicineId: 'm',
      date: '2026-10-13',
      timing: 'night' as const,
    };
    const plans = planReminders(
      [rx],
      { [doseKey(identity)]: { ...identity, takenAt: '2026-10-13T04:00:00Z' } },
      'p',
      'hi',
      Date.parse('2026-10-13T05:00:00Z'),
    );
    expect(plans).toHaveLength(2);
    expect(plans.every(item => item.id.includes('2026-10-14'))).toBe(true);
    expect(plans[0]?.title).toContain('दवा अनुस्मारक');
    expect(
      planReminders([rx], {}, 'p', 'en', Date.parse('2026-10-20T05:00:00Z')),
    ).toHaveLength(0);
  });
});
