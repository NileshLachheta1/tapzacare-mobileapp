import { useOffline } from '../offline/OfflineProvider';
import { bookingApi as mockApi } from '../offline/api';
import { useEffect, useState } from 'react';
import { isAbortError } from '../../api/mockApi';
import { useConfig } from '../../config/ConfigProvider';
import type { Doctor } from '../../config/schema';
import { useBooking } from '../booking/BookingProvider';
import { useClinicToday } from '../prescriptions/useClinicToday';
import { nextAvailableSlot, type DoctorAvailability } from './availability';

export function useDoctorAvailability(doctors: Doctor[], attempt: number) {
  const { online, items } = useOffline();
  const queueRevision = items
    .map(item => `${item.id}:${item.status}`)
    .join('|');
  const { settings, getMockSettings } = useConfig();
  const { availabilityRevision } = useBooking();
  const today = useClinicToday();
  const [expiryAttempt, setExpiryAttempt] = useState(0);
  const ids = JSON.stringify(doctors.map(doctor => doctor.id).sort());
  const [availability, setAvailability] = useState<
    Record<string, DoctorAvailability>
  >({});
  useEffect(() => {
    const nextStart = Math.min(
      ...Object.values(availability).flatMap(item =>
        item.status === 'ready' && item.slot
          ? [Date.parse(item.slot.startsAt)]
          : [],
      ),
    );
    if (!Number.isFinite(nextStart)) {
      return;
    }
    const timer = setTimeout(
      () => setExpiryAttempt(value => value + 1),
      Math.max(1, nextStart - Date.now() + 1),
    );
    return () => clearTimeout(timer);
  }, [availability]);
  useEffect(() => {
    const request = new AbortController();
    const doctorIds = JSON.parse(ids) as string[];
    setAvailability(
      Object.fromEntries(
        doctorIds.map(id => [id, { status: 'loading', slot: null }]),
      ),
    );
    for (const doctorId of doctorIds) {
      void nextAvailableSlot(
        mockApi,
        doctorId,
        getMockSettings(),
        request.signal,
      )
        .then(slot => {
          if (!request.signal.aborted) {
            setAvailability(previous => ({
              ...previous,
              [doctorId]: { status: slot ? 'ready' : 'empty', slot },
            }));
          }
        })
        .catch(error => {
          if (!request.signal.aborted && !isAbortError(error)) {
            setAvailability(previous => ({
              ...previous,
              [doctorId]: { status: 'error', slot: null },
            }));
          }
        });
    }
    return () => request.abort();
  }, [
    online,
    queueRevision,
    ids,
    today,
    attempt,
    availabilityRevision,
    expiryAttempt,
    settings.latencyMs,
    settings.failSlots,
    settings.emptySlots,
    getMockSettings,
  ]);
  return availability;
}
