import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Replace only the native gesture/portal boundary. Booking UI, controller and API stay real.
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, ScrollView, TouchableOpacity } = require('react-native');
  const Modal = React.forwardRef(({ children, onDismiss }, ref) => {
    const [visible, setVisible] = React.useState(false);
    React.useImperativeHandle(
      ref,
      () => ({
        present: () => setVisible(true),
        dismiss: () => {
          if (visible) {
            setVisible(false);
            onDismiss?.();
          }
        },
      }),
      [visible, onDismiss],
    );
    return visible
      ? React.createElement(View, { testID: 'native-booking-sheet' }, children)
      : null;
  });
  Modal.displayName = 'NativeBottomSheetBoundary';
  return {
    BottomSheetModal: Modal,
    BottomSheetModalProvider: ({ children }) => children,
    BottomSheetBackdrop: View,
    BottomSheetScrollView: ScrollView,
    TouchableOpacity,
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(callback => {
    callback({ isConnected: true, isInternetReachable: true });
    return jest.fn();
  }),
}));
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getInitialNotification: jest.fn(async () => null),
    onForegroundEvent: jest.fn(() => jest.fn()),
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1 })),
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    createChannel: jest.fn(async () => 'medicine-reminders'),
    getTriggerNotificationIds: jest.fn(async () => []),
    createTriggerNotification: jest.fn(async () => 'test'),
    cancelTriggerNotifications: jest.fn(async () => {}),
  },
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1 },
  TriggerType: { TIMESTAMP: 0 },
  AndroidImportance: { DEFAULT: 3 },
  EventType: { PRESS: 1 },
}));
