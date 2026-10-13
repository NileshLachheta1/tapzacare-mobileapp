import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { useConfig } from '../../config/ConfigProvider';
import { DoseRepository } from '../../storage/doseRepository';
import { DoseTracker } from './DoseTracker';

export const demoPatient = { id: 'lakshmi-rao', name: 'Lakshmi Rao' };
const DoseContext = createContext<DoseTracker | null>(null);
export function DoseProvider({ children }: React.PropsWithChildren) {
  const { getMockSettings } = useConfig();
  const [tracker] = useState(
    () =>
      new DoseTracker(
        demoPatient.id,
        new DoseRepository(undefined, () => getMockSettings().failDoseSave),
      ),
  );
  useEffect(() => {
    void tracker.hydrate();
  }, [tracker]);
  return (
    <DoseContext.Provider value={tracker}>{children}</DoseContext.Provider>
  );
}
export function useDoses() {
  const tracker = useContext(DoseContext);
  if (!tracker) {
    throw new Error('useDoses must be used within DoseProvider');
  }
  const state = useSyncExternalStore(
    tracker.subscribe,
    tracker.getSnapshot,
    tracker.getSnapshot,
  );
  return { tracker, patientId: tracker.patientId, ...state };
}
