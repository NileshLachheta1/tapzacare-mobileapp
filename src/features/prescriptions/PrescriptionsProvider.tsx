import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { isAbortError, mockApi } from '../../api/mockApi';
import { useConfig } from '../../config/ConfigProvider';
import { prescriptionsSchema, type Prescription } from './contracts';

type Directory = {
  prescriptions: Prescription[];
  loading: boolean;
  failed: boolean;
  retry(): void;
};
const PrescriptionContext = createContext<Directory | null>(null);
export function PrescriptionsProvider({ children }: React.PropsWithChildren) {
  const { settings, getMockSettings } = useConfig();
  const [state, setState] = useState({
    prescriptions: [] as Prescription[],
    loading: true,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const request = new AbortController();
    setState(previous => ({ ...previous, loading: true, failed: false }));
    void mockApi
      .getPrescriptions(getMockSettings(), request.signal)
      .then(raw => {
        const prescriptions = prescriptionsSchema
          .parse(raw)
          .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
        if (!request.signal.aborted) {
          setState({ prescriptions, loading: false, failed: false });
        }
      })
      .catch(error => {
        if (!request.signal.aborted && !isAbortError(error)) {
          setState(previous => ({ ...previous, loading: false, failed: true }));
        }
      });
    return () => request.abort();
  }, [
    settings.latencyMs,
    settings.failPrescriptions,
    settings.emptyPrescriptions,
    settings.emptyLists,
    getMockSettings,
    attempt,
  ]);
  return (
    <PrescriptionContext.Provider value={{ ...state, retry }}>
      {children}
    </PrescriptionContext.Provider>
  );
}
export function usePrescriptions() {
  const value = useContext(PrescriptionContext);
  if (!value) {
    throw new Error(
      'usePrescriptions must be used within PrescriptionsProvider',
    );
  }
  return value;
}
