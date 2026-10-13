import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfig } from '../../config/ConfigProvider';
import { OfflineQueue } from './Queue';
import { isOnline, setConnected, setSimulated, submitQueued } from './api';
const Context = createContext<{
  queue: OfflineQueue;
  online: boolean;
  simulated: boolean;
  simulate(value: boolean): void;
} | null>(null);
export function OfflineProvider({ children }: React.PropsWithChildren) {
  const { consumeConfirmationSettings } = useConfig();
  const [queue] = useState(
    () =>
      new OfflineQueue(
        AsyncStorage,
        item => submitQueued(item, consumeConfirmationSettings()),
        isOnline,
      ),
  );
  const [networkReady, setNetworkReady] = useState(false);
  const snapshot = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot,
  );
  const [online, setOnline] = useState(isOnline());
  const [simulated, simulateState] = useState(false);
  useEffect(() => {
    void queue.hydrate().then(() => queue.sync());
    const unsubscribe = NetInfo.addEventListener(net => {
      setConnected(
        net.isConnected === true && net.isInternetReachable !== false,
      );
      setNetworkReady(true);
      setOnline(isOnline());
      if (isOnline()) void queue.sync();
    });
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void queue.sync();
    });
    return () => {
      unsubscribe();
      sub.remove();
      setSimulated(false);
    };
  }, [queue]);
  useEffect(() => {
    if (
      online &&
      snapshot.ready &&
      snapshot.items.some(item => item.status === 'queued')
    ) {
      const timer = setTimeout(() => {
        void queue.sync();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [online, snapshot, queue]);
  const simulate = (value: boolean) => {
    setSimulated(value);
    simulateState(value);
    setOnline(isOnline());
    if (isOnline()) void queue.sync();
  };
  return (
    <Context.Provider value={{ queue, online, simulated, simulate }}>
      {networkReady ? children : null}
    </Context.Provider>
  );
}
export function useOffline() {
  const context = useContext(Context);
  if (!context) throw new Error('OfflineProvider missing');
  const state = useSyncExternalStore(
    context.queue.subscribe,
    context.queue.getSnapshot,
    context.queue.getSnapshot,
  );
  return { ...context, ...state };
}
