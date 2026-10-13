import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { addClinicDays, clinicDate } from '../booking/dates';

/** Update an open schedule at IST midnight and when returning from the background. */
export function useClinicToday() {
  const [today, setToday] = useState(() => clinicDate());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const current = clinicDate();
      setToday(current);
      const midnight = new Date(
        `${addClinicDays(current, 1)}T00:00:00+05:30`,
      ).getTime();
      timer = setTimeout(refresh, Math.max(1, midnight - Date.now() + 1));
    };
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  return today;
}
