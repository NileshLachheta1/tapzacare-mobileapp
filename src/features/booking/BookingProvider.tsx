import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { bookingApi, isOnline } from '../offline/api';
import { useOffline } from '../offline/OfflineProvider';
import { useConfig } from '../../config/ConfigProvider';
import { BookingController } from './controller';

const BookingContext = createContext<BookingController | null>(null);
export function BookingProvider({ children }: React.PropsWithChildren) {
  const { getMockSettings, consumeConfirmationSettings } = useConfig();
  const { queue } = useOffline();
  const [controller] = useState(
    () =>
      new BookingController({
        api: bookingApi,
        offline: () => !isOnline(),
        enqueue: queue.enqueue,
        settings: getMockSettings,
        consumeConfirmationSettings,
      }),
  );
  useEffect(() => () => controller.dispose(), [controller]);
  return (
    <BookingContext.Provider value={controller}>
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </BookingContext.Provider>
  );
}
export function useBooking() {
  const controller = useContext(BookingContext);
  if (!controller) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { controller, ...state };
}
