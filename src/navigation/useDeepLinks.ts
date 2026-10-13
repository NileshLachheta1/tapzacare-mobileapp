import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useBooking } from '../features/booking/BookingProvider';
import { useConfig } from '../config/ConfigProvider';
import { bookingApi } from '../features/offline/api';
import { parseCareLink } from './deepLinks';
import type { RootTabParams } from './types';
export function useDeepLinks(
  navigation: NavigationContainerRefWithCurrent<RootTabParams>,
  ready: boolean,
) {
  const { controller, flow } = useBooking();
  const { initialized, config, getMockSettings } = useConfig();
  const [url, setUrl] = useState<string | null>(null);
  const serial = useRef(0);
  useEffect(() => {
    const sub = Linking.addEventListener('url', event => setUrl(event.url));
    void Linking.getInitialURL().then(value => {
      if (value) setUrl(value);
    });
    void notifee
      .getInitialNotification()
      .then(value => {
        const target = value?.notification.data?.url;
        if (typeof target === 'string') setUrl(target);
      })
      .catch(() => {});
    const off = notifee.onForegroundEvent(({ type, detail }) => {
      const target = detail.notification?.data?.url;
      if (type === EventType.PRESS && typeof target === 'string')
        setUrl(target);
    });
    return () => {
      sub.remove();
      off();
    };
  }, []);
  useEffect(() => {
    if (!url || !ready || !initialized || flow.confirmation === 'submitting')
      return;
    const current=++serial.current;
    const target = parseCareLink(url);
    setUrl(null);
    if (!target) {
      Alert.alert(
        'Link unavailable',
        'Use a Tapza Care doctor or prescription link.',
      );
      return;
    }
    if (target.kind === 'prescription') {
      if (!config.tabs.some(tab => tab.screen === 'prescriptions')) {
        Alert.alert(
          'Screen unavailable',
          'Enable the Medicines tab in the configuration.',
        );
        return;
      }
      controller.close();
      navigation.navigate('prescriptions', {
        screen: 'PrescriptionDetail',
        params: { prescriptionId: target.id },
      });
      return;
    }
    void bookingApi
      .getDoctors(getMockSettings())
      .then(doctors => {
        if (current !== serial.current) return;
        const doctor = doctors.find(item => item.id === target.id);
        if (doctor) controller.openDoctor(doctor);
        else
          Alert.alert(
            'Doctor unavailable',
            'This doctor is not in the current directory.',
          );
      })
      .catch(() =>
        Alert.alert(
          'Could not open doctor',
          'Connect to the internet or retry the link.',
        ),
      );
  }, [
    url,
    ready,
    initialized,
    config.tabs,
    controller,
    flow.confirmation,
    getMockSettings,
    navigation,
  ]);
}
