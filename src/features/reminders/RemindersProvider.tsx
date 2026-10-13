import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import notifee, {
  AuthorizationStatus,
  TriggerType,
  AndroidImportance,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockApi } from '../../api/mockApi';
import { useConfig } from '../../config/ConfigProvider';
import { usePreferences } from '../settings/Preferences';
import { useDoses } from '../prescriptions/DoseProvider';
import { useClinicToday } from '../prescriptions/useClinicToday';
import { planReminders } from './planner';
const Context = createContext({
  enabled: false,
  busy: false,
  message: '',
  toggle: async () => {},
  test: async () => {},
});
const key = 'tapza.reminders.v1';
export function RemindersProvider({ children }: React.PropsWithChildren) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const { getMockSettings } = useConfig();
  const { language } = usePreferences();
  const { records, patientId, status } = useDoses();
  const today = useClinicToday();
  const chain = useRef(Promise.resolve());
  const enabledRef = useRef(false);
  const current = useRef({ records, language, patientId });
  current.current = { records, language, patientId };
  useEffect(() => {
    void AsyncStorage.getItem(key)
      .then(value => {
        enabledRef.current = value === 'true';
        setEnabled(value === 'true');
      })
      .catch(() => setMessage('Could not restore reminder settings.'))
      .finally(() => setReady(true));
  }, []);
  const channel = () =>
    notifee.createChannel({
      id: 'medicine-reminders',
      name: 'Medicine reminders',
      importance: AndroidImportance.DEFAULT,
    });
  const reconcile = () => {
    chain.current = chain.current
      .then(async () => {
        if (!enabledRef.current) return;
        const permission = await notifee.getNotificationSettings();
        if (permission.authorizationStatus === AuthorizationStatus.DENIED) {
          setMessage('Notifications are disabled in device settings.');
          return;
        }
        const prescriptions = await mockApi.getPrescriptions(getMockSettings());
        const c = current.current;
        const desired = planReminders(
          prescriptions,
          c.records,
          c.patientId,
          c.language,
        );
        const id = await channel();
        const existing = await notifee.getTriggerNotificationIds();
        for (const item of desired) {
          if (!enabledRef.current) return;
          await notifee.createTriggerNotification(
            {
              id: item.id,
              title: item.title,
              body: item.body,
              data: {
                url: `tapzacare://prescription/${encodeURIComponent(
                  item.prescriptionId,
                )}`,
              },
              android: {
                channelId: id,
                smallIcon: 'ic_notification',
                pressAction: { id: 'default' },
              },
              ios: { sound: 'default' },
            },
            { type: TriggerType.TIMESTAMP, timestamp: item.timestamp },
          );
        }
        await notifee.cancelTriggerNotifications(
          existing.filter(
            item =>
              item.startsWith('medicine-') &&
              item !== 'medicine-test' &&
              !desired.some(want => want.id === item),
          ),
        );
        setMessage(
          `${desired.length} reminders scheduled for the next 7 days. Times: 08:00, 14:00, 21:00 IST. Open the app weekly to renew.`,
        );
      })
      .catch(() =>
        setMessage('Could not update reminders. Check permissions and retry.'),
      );
    return chain.current;
  };
  const refreshRef = useRef(reconcile);
  refreshRef.current = reconcile;
  useEffect(() => {
    if (ready && enabled && status === 'ready') void refreshRef.current();
  }, [ready, enabled, status, records, language, today]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshRef.current();
    });
    return () => sub.remove();
  }, []);
  const toggle = async () => {
    if (busy || !ready) return;
    setBusy(true);
    try {
      if (enabledRef.current) {
        enabledRef.current = false;
        await chain.current;
        const ids = await notifee.getTriggerNotificationIds();
        await notifee.cancelTriggerNotifications(
          ids.filter(id => id.startsWith('medicine-')),
        );
        await AsyncStorage.setItem(key, 'false');
        setEnabled(false);
        setMessage('Reminders disabled.');
      } else {
        const permission = await notifee.requestPermission();
        if (permission.authorizationStatus === AuthorizationStatus.DENIED) {
          setMessage(
            'Allow notifications in device settings to enable reminders.',
          );
          return;
        }
        await channel();
        await AsyncStorage.setItem(key, 'true');
        enabledRef.current = true;
        setEnabled(true);
      }
    } catch {
      enabledRef.current = enabled;
      setMessage('Could not save reminder settings. Please retry.');
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    setBusy(true);
    try {
      const permission = await notifee.requestPermission();
      if (permission.authorizationStatus === AuthorizationStatus.DENIED) {
        setMessage('Notification permission was denied.');
        return;
      }
      const id = await channel();
      await notifee.createTriggerNotification(
        {
          id: 'medicine-test',
          title: 'Tapza Care · Test reminder',
          body: 'Your medicine reminders are ready.',
          android: {
            channelId: id,
            smallIcon: 'ic_notification',
            pressAction: { id: 'default' },
          },
          ios: { sound: 'default' },
        },
        { type: TriggerType.TIMESTAMP, timestamp: Date.now() + 10000 },
      );
      setMessage(
        'Test scheduled. Delivery time depends on device battery settings.',
      );
    } catch {
      setMessage('Could not schedule the test reminder.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Context.Provider value={{ enabled, busy, message, toggle, test }}>
      {children}
    </Context.Provider>
  );
}
export const useReminders = () => useContext(Context);
