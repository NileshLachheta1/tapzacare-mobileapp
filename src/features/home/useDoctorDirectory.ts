import { useCallback, useEffect, useState } from 'react';
import { isAbortError, mockApi } from '../../api/mockApi';
import { useConfig } from '../../config/ConfigProvider';
import type { Doctor } from '../../config/schema';
import type { DoctorDirectory } from './types';
import { useDoctorAvailability } from './useDoctorAvailability';

export function useDoctorDirectory(): DoctorDirectory {
  const { settings, getMockSettings } = useConfig();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    void mockApi
      .getDoctors(getMockSettings(), controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setDoctors(result);
          setLoading(false);
        }
      })
      .catch(error => {
        if (!isAbortError(error) && !controller.signal.aborted) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [
    settings.latencyMs,
    settings.failDoctors,
    settings.emptyLists,
    getMockSettings,
    attempt,
  ]);
  const availability = useDoctorAvailability(doctors, attempt);
  return { doctors, loading, failed, retry, availability };
}
