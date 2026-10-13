import type { Slot } from './contracts';

export const CLINIC_TIME_ZONE = 'Asia/Kolkata';
const dayMs = 24 * 60 * 60 * 1000;
export function clinicDate(value: Date | number = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T12:00:00+05:30`);
  return Number.isFinite(parsed.getTime()) && clinicDate(parsed) === value;
}
export function addClinicDays(date: string, days: number): string {
  return clinicDate(
    new Date(`${date}T12:00:00+05:30`).getTime() + days * dayMs,
  );
}
export function dateChoices(now = Date.now(), count = 14): string[] {
  const today = clinicDate(now);
  return Array.from({ length: count }, (_, index) =>
    addClinicDays(today, index),
  );
}
export function formatDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  },
): string {
  return new Intl.DateTimeFormat('en-IN', {
    ...options,
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00+05:30`));
}
export function formatSlotTime(startsAt: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: CLINIC_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(startsAt));
}
export function canBookSlot(
  slot: Slot,
  doctorId: string,
  date: string,
  now = Date.now(),
): boolean {
  return (
    slot.available &&
    slot.doctorId === doctorId &&
    clinicDate(new Date(slot.startsAt)) === date &&
    Date.parse(slot.startsAt) > now
  );
}
