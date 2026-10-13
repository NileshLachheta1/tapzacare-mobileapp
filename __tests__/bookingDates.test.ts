import {
  addClinicDays,
  canBookSlot,
  clinicDate,
  dateChoices,
  formatSlotTime,
  isDateKey,
} from '../src/features/booking/dates';
describe('clinic dates and slots', () => {
  it('uses India dates even at the UTC midnight boundary and crosses leap/month boundaries', () => {
    expect(clinicDate(new Date('2026-10-12T19:00:00Z'))).toBe('2026-10-13');
    expect(dateChoices(Date.parse('2026-12-31T19:00:00Z'), 2)).toEqual([
      '2027-01-01',
      '2027-01-02',
    ]);
    expect(addClinicDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addClinicDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('13/10/2026')).toBe(false);
  });
  it('accepts only future available slots belonging to the selected doctor/date', () => {
    const slot = {
      id: 'a',
      doctorId: 'ananya',
      startsAt: '2026-10-13T09:00:00+05:30',
      endsAt: '2026-10-13T09:30:00+05:30',
      available: true,
    };
    const now = Date.parse('2026-10-13T02:00:00Z');
    expect(canBookSlot(slot, 'ananya', '2026-10-13', now)).toBe(true);
    expect(canBookSlot(slot, 'arjun', '2026-10-13', now)).toBe(false);
    expect(
      canBookSlot({ ...slot, available: false }, 'ananya', '2026-10-13', now),
    ).toBe(false);
    expect(canBookSlot(slot, 'ananya', '2026-10-14', now)).toBe(false);
    expect(
      canBookSlot(slot, 'ananya', '2026-10-13', Date.parse(slot.startsAt)),
    ).toBe(false);
    expect(formatSlotTime(slot.startsAt)).toMatch(/9:00\s*am/i);
  });
});
