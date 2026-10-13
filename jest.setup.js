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
